from __future__ import annotations

from collections import defaultdict, deque
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from secrets import compare_digest
from threading import Lock
from time import monotonic

import jwt
from fastapi import Depends, FastAPI, Header, HTTPException, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import delete, func, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .config import get_settings
from .database import Base, engine, get_db
from .models import FoundingInvite, LeaderboardConsent, ProgressEvent, RefreshSession, SkillCatalog, User, UserProfile, UserSkill, now_utc
from .schemas import AuthResponse, DashboardResponse, FoundingClaimRequest, LoginRequest, ProfileUpdate, ProgressEventCreate, RefreshRequest, RegisterRequest, SkillProgressResponse, SkillResponse, UserResponse
from .security import create_access_token, create_refresh_token, decode_access_token, hash_password, hash_token, normalize_email, verify_password


settings = get_settings()
settings.validate_for_startup()


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(engine)
    with Session(engine) as db:
        for rank, (slug, name, category, description, goal) in enumerate(POPULAR_SKILLS, start=1):
            if not db.get(SkillCatalog, slug):
                db.add(SkillCatalog(slug=slug, name=name, category=category, description=description, default_goal=goal, popularity_rank=rank))
        db.commit()
    yield


app = FastAPI(title="RISE Beta API", version="1.0.0", docs_url="/docs" if settings.env != "production" else None, lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins, allow_credentials=False, allow_methods=["GET", "POST", "PUT", "DELETE"], allow_headers=["Authorization", "Content-Type"])
bearer = HTTPBearer(auto_error=False)
attempts: dict[str, deque[float]] = defaultdict(deque)
attempt_lock = Lock()

POPULAR_SKILLS = [
    ("react-native", "React Native", "Career", "Build useful mobile apps with guided practice.", "software-engineer"),
    ("youtube-storytelling", "YouTube Storytelling", "Creator", "Plan clearer videos with stronger hooks and retention.", "youtube"),
    ("barbering-fades", "Barbering Fades", "Trade", "Practice consultation, blending, safety, and finish quality.", "barbering"),
    ("strength-basics", "Strength Basics", "Fitness", "Build safe form, consistency, recovery, and progression.", "fitness"),
    ("graphic-design", "Graphic Design", "Creative", "Learn hierarchy, type, color, layout, and critique.", "graphic-design"),
    ("focus-habits", "Focus & Habits", "Personal", "Create a repeatable system for attention and follow-through.", "personal"),
    ("communication", "Communication", "Universal", "Practice clear speaking, listening, writing, and feedback.", "personal"),
    ("financial-literacy", "Financial Literacy", "Career", "Understand budgets, risk, research, and ethical decisions.", "finance"),
]

@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-store" if request.url.path.startswith(("/auth", "/users", "/profiles", "/progress", "/admin")) else "public, max-age=60"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    return response


def enforce_rate_limit(request: Request, bucket: str, limit: int = 6, seconds: int = 60) -> None:
    address = request.client.host if request.client else "unknown"
    key = f"{bucket}:{address}"
    now = monotonic()
    with attempt_lock:
        history = attempts[key]
        while history and history[0] <= now - seconds:
            history.popleft()
        if len(history) >= limit:
            raise HTTPException(status_code=429, detail="Too many attempts. Please wait and try again.")
        history.append(now)


def get_current_user(credentials: HTTPAuthorizationCredentials | None = Depends(bearer), db: Session = Depends(get_db)) -> User:
    if not credentials:
        raise HTTPException(status_code=401, detail="Sign in required")
    try:
        user_id = decode_access_token(credentials.credentials)
    except jwt.InvalidTokenError as exc:
        raise HTTPException(status_code=401, detail="Session expired") from exc
    user = db.get(User, user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Account unavailable")
    return user


def issue_session(db: Session, user: User) -> AuthResponse:
    raw_refresh = create_refresh_token()
    db.add(RefreshSession(user_id=user.id, token_hash=hash_token(raw_refresh), expires_at=now_utc() + timedelta(days=settings.refresh_token_days)))
    db.commit()
    return AuthResponse(access_token=create_access_token(user.id), refresh_token=raw_refresh, user=UserResponse.model_validate(user))


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/config/public")
def public_config() -> dict[str, bool]:
    return {"founding_redemption_enabled": settings.founding_redemption_enabled}


@app.post("/auth/register", response_model=AuthResponse, status_code=201)
def register(payload: RegisterRequest, request: Request, db: Session = Depends(get_db)) -> AuthResponse:
    enforce_rate_limit(request, "register")
    email = normalize_email(str(payload.email))
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(status_code=409, detail="An account with this email already exists")

    invite = None
    if payload.founding_code:
        if not settings.founding_redemption_enabled:
            raise HTTPException(status_code=403, detail="Founding-member claims open after the App Store launch")
        invite = db.scalar(select(FoundingInvite).where(FoundingInvite.email == email, FoundingInvite.code_hash == hash_token(payload.founding_code.strip()), FoundingInvite.claimed_at.is_(None)))
        if not invite:
            raise HTTPException(status_code=400, detail="This founding-member code is invalid, used, or belongs to another email")

    user = User(email=email, display_name=payload.display_name, password_hash=hash_password(payload.password), is_founding_member=invite is not None, founding_expires_at=now_utc() + timedelta(days=settings.founding_member_days) if invite else None)
    db.add(user)
    try:
        db.flush()
        if invite:
            invite.claimed_at = now_utc()
            invite.claimed_by_user_id = user.id
        if payload.signup_elapsed_seconds is not None:
            db.add(ProgressEvent(user_id=user.id, client_event_id="signup:completed", event_type="signup_completed", skill_slug="onboarding", value=0, minutes=0, event_metadata={"elapsed_seconds": payload.signup_elapsed_seconds}))
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Account could not be created") from exc
    db.refresh(user)
    return issue_session(db, user)


@app.post("/auth/login", response_model=AuthResponse)
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)) -> AuthResponse:
    enforce_rate_limit(request, "login")
    user = db.scalar(select(User).where(User.email == normalize_email(str(payload.email))))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email or password is incorrect")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")
    return issue_session(db, user)


@app.post("/auth/refresh", response_model=AuthResponse)
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)) -> AuthResponse:
    token_hash = hash_token(payload.refresh_token)
    session = db.scalar(select(RefreshSession).where(RefreshSession.token_hash == token_hash, RefreshSession.revoked_at.is_(None)))
    if not session or session.expires_at.replace(tzinfo=timezone.utc) <= now_utc():
        raise HTTPException(status_code=401, detail="Refresh session expired")
    user = db.get(User, session.user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Account unavailable")
    session.revoked_at = now_utc()
    db.commit()
    return issue_session(db, user)


@app.post("/auth/logout", status_code=204)
def logout(payload: RefreshRequest, db: Session = Depends(get_db)) -> Response:
    session = db.scalar(select(RefreshSession).where(RefreshSession.token_hash == hash_token(payload.refresh_token)))
    if session and not session.revoked_at:
        session.revoked_at = now_utc()
        db.commit()
    return Response(status_code=204)


@app.get("/users/me", response_model=UserResponse)
def me(user: User = Depends(get_current_user)) -> User:
    return user


@app.post("/users/me/founding-claim", response_model=UserResponse)
def claim_founding(payload: FoundingClaimRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
    if not settings.founding_redemption_enabled:
        raise HTTPException(status_code=403, detail="Founding-member claims open after the App Store launch")
    if user.is_founding_member:
        return user
    invite = db.scalar(select(FoundingInvite).where(FoundingInvite.email == user.email, FoundingInvite.code_hash == hash_token(payload.founding_code.strip()), FoundingInvite.claimed_at.is_(None)))
    if not invite:
        raise HTTPException(status_code=400, detail="This founding-member code is invalid, used, or belongs to another email")
    invite.claimed_at = now_utc()
    invite.claimed_by_user_id = user.id
    user.is_founding_member = True
    user.founding_expires_at = now_utc() + timedelta(days=settings.founding_member_days)
    db.commit()
    db.refresh(user)
    return user


@app.delete("/users/me", status_code=204)
def delete_me(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Response:
    db.execute(update(FoundingInvite).where(FoundingInvite.claimed_by_user_id == user.id).values(claimed_by_user_id=None))
    db.execute(delete(RefreshSession).where(RefreshSession.user_id == user.id))
    db.execute(delete(ProgressEvent).where(ProgressEvent.user_id == user.id))
    db.execute(delete(UserSkill).where(UserSkill.user_id == user.id))
    db.execute(delete(LeaderboardConsent).where(LeaderboardConsent.user_id == user.id))
    db.execute(delete(UserProfile).where(UserProfile.user_id == user.id))
    db.delete(user)
    db.commit()
    return Response(status_code=204)


@app.get("/users/me/export")
def export_me(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    profile = db.get(UserProfile, user.id)
    skills = list(db.scalars(select(UserSkill).where(UserSkill.user_id == user.id)))
    events = list(db.scalars(select(ProgressEvent).where(ProgressEvent.user_id == user.id).order_by(ProgressEvent.created_at)))
    return {
        "exported_at": now_utc().isoformat(),
        "format_version": 1,
        "account": {"id": user.id, "email": user.email, "display_name": user.display_name, "is_founding_member": user.is_founding_member, "founding_expires_at": user.founding_expires_at},
        "profile": None if not profile else {"selected_goals": profile.selected_goals, "custom_goal": profile.custom_goal, "weekly_skill": profile.weekly_skill, "focus_skills": profile.focus_skills, "commitment": profile.commitment, "available_time": profile.available_time, "experience": profile.experience, "updated_at": profile.updated_at},
        "skills": [{"skill_slug": item.skill_slug, "selected_at": item.selected_at, "baseline_score": item.baseline_score, "latest_score": item.latest_score, "missions_completed": item.missions_completed, "minutes_logged": item.minutes_logged} for item in skills],
        "progress_events": [{"client_event_id": item.client_event_id, "event_type": item.event_type, "skill_slug": item.skill_slug, "value": item.value, "minutes": item.minutes, "metadata": item.event_metadata, "created_at": item.created_at} for item in events],
    }


@app.put("/profiles/me", status_code=204)
def update_profile(payload: ProfileUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Response:
    profile = db.get(UserProfile, user.id) or UserProfile(user_id=user.id)
    for field, value in payload.model_dump().items():
        setattr(profile, field, value)
    db.add(profile)
    for skill_name in payload.focus_skills:
        slug = "-".join(skill_name.lower().split())[:100]
        existing = db.scalar(select(UserSkill).where(UserSkill.user_id == user.id, UserSkill.skill_slug == slug))
        if not existing:
            db.add(UserSkill(user_id=user.id, skill_slug=slug))
    db.commit()
    return Response(status_code=204)


@app.get("/skills/popular", response_model=list[SkillResponse])
def popular_skills(db: Session = Depends(get_db)) -> list[SkillCatalog]:
    return list(db.scalars(select(SkillCatalog).where(SkillCatalog.active.is_(True)).order_by(SkillCatalog.popularity_rank).limit(12)))


@app.post("/progress/events", status_code=201)
def record_progress(payload: ProgressEventCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict[str, bool]:
    existing = db.scalar(select(ProgressEvent).where(ProgressEvent.user_id == user.id, ProgressEvent.client_event_id == payload.client_event_id))
    if existing:
        return {"created": False}
    event = ProgressEvent(user_id=user.id, client_event_id=payload.client_event_id, event_type=payload.event_type, skill_slug=payload.skill_slug, value=payload.value, minutes=payload.minutes, event_metadata=payload.metadata)
    if payload.event_type == "app_session":
        seconds = payload.metadata.get("duration_seconds")
        if not isinstance(seconds, int) or not 10 <= seconds <= 3600 or payload.minutes != 0:
            raise HTTPException(status_code=422, detail="Invalid app session duration")
        db.add(event)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            return {"created": False}
        return {"created": True}
    skill = db.scalar(select(UserSkill).where(UserSkill.user_id == user.id, UserSkill.skill_slug == payload.skill_slug))
    if not skill:
        # SQLAlchemy column defaults are applied during INSERT, so initialize
        # counters explicitly while this new object is still in memory.
        skill = UserSkill(user_id=user.id, skill_slug=payload.skill_slug, missions_completed=0, minutes_logged=0)
        db.add(skill)
    if payload.event_type == "quiz_completed":
        if skill.baseline_score is None:
            skill.baseline_score = payload.value
        skill.latest_score = payload.value
    if payload.event_type == "mission_completed":
        skill.missions_completed = (skill.missions_completed or 0) + 1
    skill.minutes_logged = (skill.minutes_logged or 0) + payload.minutes
    db.add(event)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        return {"created": False}
    return {"created": True}


@app.get("/users/me/dashboard", response_model=DashboardResponse)
def dashboard(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> DashboardResponse:
    skills = list(db.scalars(select(UserSkill).where(UserSkill.user_id == user.id).order_by(UserSkill.selected_at)))
    progress = [SkillProgressResponse(skill_slug=item.skill_slug, baseline_score=item.baseline_score, latest_score=item.latest_score, improvement_points=(item.latest_score - item.baseline_score) if item.latest_score is not None and item.baseline_score is not None else None, missions_completed=item.missions_completed, minutes_logged=item.minutes_logged) for item in skills]
    total_missions = db.scalar(select(func.count()).select_from(ProgressEvent).where(ProgressEvent.user_id == user.id, ProgressEvent.event_type == "mission_completed")) or 0
    total_minutes = db.scalar(select(func.coalesce(func.sum(ProgressEvent.minutes), 0)).where(ProgressEvent.user_id == user.id)) or 0
    return DashboardResponse(user=UserResponse.model_validate(user), skills=progress, total_missions=int(total_missions), total_minutes=int(total_minutes))


def leaderboard_snapshot(db: Session, user: User) -> dict:
    participants = list(db.scalars(select(LeaderboardConsent.user_id)))
    scores = []
    for participant_id in participants:
        missions = db.scalar(select(func.count()).select_from(ProgressEvent).where(ProgressEvent.user_id == participant_id, ProgressEvent.event_type == "mission_completed")) or 0
        minutes = db.scalar(select(func.coalesce(func.sum(ProgressEvent.minutes), 0)).where(ProgressEvent.user_id == participant_id)) or 0
        scores.append((participant_id, int(missions), int(minutes)))
    scores.sort(key=lambda item: (-item[1], -item[2], item[0]))
    rank = next((index for index, item in enumerate(scores, 1) if item[0] == user.id), None)
    return {"opted_in": rank is not None, "rank": rank, "participants": len(scores), "missions": scores[rank - 1][1] if rank else 0}


@app.get("/users/me/leaderboard")
def my_leaderboard(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    return leaderboard_snapshot(db, user)


@app.put("/users/me/leaderboard")
def opt_in_leaderboard(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    if not db.get(LeaderboardConsent, user.id):
        db.add(LeaderboardConsent(user_id=user.id))
        db.commit()
    return leaderboard_snapshot(db, user)


@app.delete("/users/me/leaderboard")
def opt_out_leaderboard(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    db.execute(delete(LeaderboardConsent).where(LeaderboardConsent.user_id == user.id))
    db.commit()
    return leaderboard_snapshot(db, user)


@app.get("/admin/analytics")
def admin_analytics(x_rise_admin_key: str | None = Header(default=None), db: Session = Depends(get_db)) -> dict:
    if not settings.admin_api_key or not x_rise_admin_key or not compare_digest(x_rise_admin_key, settings.admin_api_key):
        raise HTTPException(status_code=403, detail="Admin access denied")
    users = list(db.scalars(select(User)))
    events = list(db.scalars(select(ProgressEvent)))
    event_by_user: dict[str, list[ProgressEvent]] = defaultdict(list)
    for event in events:
        event_by_user[event.user_id].append(event)
    now = now_utc()
    signups = [event.event_metadata.get("elapsed_seconds") for event in events if event.event_type == "signup_completed" and isinstance(event.event_metadata.get("elapsed_seconds"), int)]
    members = []
    first_mission_delays = []
    for user in users:
        user_events = event_by_user[user.id]
        missions = [event for event in user_events if event.event_type == "mission_completed"]
        minutes = sum(event.minutes for event in user_events)
        app_seconds = sum(event.event_metadata.get("duration_seconds", 0) for event in user_events if event.event_type == "app_session")
        first_mission = min((event.created_at for event in missions), default=None)
        if first_mission:
            first_mission_delays.append(max(0, (first_mission.replace(tzinfo=timezone.utc) - user.created_at.replace(tzinfo=timezone.utc)).total_seconds() / 60))
        last_activity = max((event.created_at for event in user_events), default=None)
        members.append({"user_id": user.id, "joined_at": user.created_at, "missions_completed": len(missions), "focused_minutes": minutes, "app_minutes": round(app_seconds / 60, 1), "active_days": len({event.created_at.date() for event in user_events}), "last_activity_at": last_activity})
    members.sort(key=lambda member: (-member["missions_completed"], -member["focused_minutes"]))
    return {"total_members": len(users), "active_last_7_days": len({event.user_id for event in events if event.created_at.replace(tzinfo=timezone.utc) >= now - timedelta(days=7)}), "members_with_mission": sum(member["missions_completed"] > 0 for member in members), "total_missions": sum(member["missions_completed"] for member in members), "total_focused_minutes": sum(member["focused_minutes"] for member in members), "total_app_minutes": round(sum(member["app_minutes"] for member in members), 1), "average_signup_seconds": round(sum(signups) / len(signups)) if signups else None, "average_minutes_to_first_mission": round(sum(first_mission_delays) / len(first_mission_delays)) if first_mission_delays else None, "members": members[:100]}
