from __future__ import annotations

from collections import defaultdict, deque
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
import logging
import os
from secrets import compare_digest
from threading import Lock
from time import monotonic, perf_counter
from uuid import uuid4

import jwt
from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import case, delete, func, or_, select, text, update
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from .config import get_settings
from .database import engine, get_db
from .mailer import send_email_verification, send_password_reset, send_product_feedback_notification
from .models import EmailVerification, FeedbackSubmissionReceipt, FoundingInvite, LeaderboardConsent, PasswordResetToken, ProductFeedback, ProgressEvent, RefreshSession, SkillCatalog, UsageAnalyticsConsent, User, UserProfile, UserSkill, now_utc
from .schemas import AuthResponse, DashboardResponse, EmailVerificationConfirm, FoundingClaimRequest, LoginRequest, PasswordResetConfirm, PasswordResetRequest, ProductFeedbackCreate, ProfileResponse, ProfileUpdate, ProgressEventCreate, RefreshRequest, RegisterRequest, SkillProgressResponse, SkillResponse, UserResponse
from .security import create_access_token, create_refresh_token, decode_access_token, hash_password, hash_token, normalize_email, verify_password
from .request_limits import RequestBodyLimitMiddleware
from .budgets import enforce_budgets
from .database_privacy import database_privacy_ready


settings = get_settings()
settings.validate_for_startup()
logger = logging.getLogger(__name__)
API_VERSION = "1.2.0"
# Equal hashing work for an unknown account; never a usable member credential.
DUMMY_PASSWORD_HASH = hash_password(str(uuid4()))


@asynccontextmanager
async def lifespan(_: FastAPI):
    with Session(engine) as db:
        if settings.env.lower() == "production" and not database_privacy_ready(db):
            raise RuntimeError("Private database table protections must be applied before production startup")
        for rank, (slug, name, category, description, goal) in enumerate(POPULAR_SKILLS, start=1):
            if not db.get(SkillCatalog, slug):
                db.add(SkillCatalog(slug=slug, name=name, category=category, description=description, default_goal=goal, popularity_rank=rank))
        db.commit()
    yield


production = settings.env.lower() == "production"
app = FastAPI(title="RISE API", version=API_VERSION, docs_url=None if production else "/docs", redoc_url=None if production else "/redoc", openapi_url=None if production else "/openapi.json", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins, allow_credentials=False, allow_methods=["GET", "POST", "PUT", "DELETE"], allow_headers=["Authorization", "Content-Type"])
app.add_middleware(RequestBodyLimitMiddleware)
bearer = HTTPBearer(auto_error=False)
attempts: dict[str, deque[float]] = defaultdict(deque)
attempt_lock = Lock()
RATE_LIMIT_MAX_BUCKETS = 10_000
RATE_LIMIT_MAX_WINDOW_SECONDS = 3_600
RATE_LIMIT_CLEANUP_INTERVAL_SECONDS = 300
last_rate_limit_cleanup = 0.0

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
    request_id = str(uuid4())
    started = perf_counter()
    if request.method in {"POST", "PUT", "PATCH"}:
        content_length = request.headers.get("content-length")
        if content_length and (not content_length.isdecimal() or len(content_length) > 10 or int(content_length) > 16384):
            response = Response(status_code=413, content="Request body too large")
        else:
            response = await call_next(request)
    else:
        response = await call_next(request)
    response.headers["Cache-Control"] = "no-store" if request.url.path.startswith(("/auth", "/users", "/profiles", "/progress", "/feedback", "/admin")) else "public, max-age=60"
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    if settings.env.lower() == "production":
        response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"
    logger.info(
        "request_complete method=%s path=%s status=%s duration_ms=%s request_id=%s",
        request.method,
        request.url.path,
        response.status_code,
        round((perf_counter() - started) * 1000),
        request_id,
    )
    return response


def enforce_rate_limit(request: Request, bucket: str, limit: int = 6, seconds: int = 60) -> None:
    global last_rate_limit_cleanup
    address = request.client.host if request.client else "unknown"
    key = f"{bucket}:{address}"
    now = monotonic()
    with attempt_lock:
        if now - last_rate_limit_cleanup >= RATE_LIMIT_CLEANUP_INTERVAL_SECONDS or len(attempts) >= RATE_LIMIT_MAX_BUCKETS:
            stale_before = now - RATE_LIMIT_MAX_WINDOW_SECONDS
            stale_keys = [candidate for candidate, values in attempts.items() if not values or values[-1] <= stale_before]
            for candidate in stale_keys:
                attempts.pop(candidate, None)
            last_rate_limit_cleanup = now
        if key not in attempts and len(attempts) >= RATE_LIMIT_MAX_BUCKETS:
            # An address spray must not grow memory without bound. Evict the
            # oldest bucket instead of rejecting every legitimate new member.
            oldest_key = min(attempts, key=lambda candidate: attempts[candidate][-1] if attempts[candidate] else 0)
            attempts.pop(oldest_key, None)
        history = attempts[key]
        while history and history[0] <= now - seconds:
            history.popleft()
        if len(history) >= limit:
            raise HTTPException(status_code=429, detail="Too many attempts. Please wait and try again.")
        history.append(now)


def auth_budget(request: Request, db: Session, bucket: str, email: str = "", limit: int = 6, seconds: int = 60) -> None:
    enforce_rate_limit(request, bucket, limit, seconds)
    address = request.client.host if request.client else "unknown"
    global_limit = 200 if bucket in {"register", "password-reset-request", "email-verification", "feedback"} else 5000
    limits = [(f"auth-global:{bucket}", global_limit, 3600, 1), (f"auth-ip:{bucket}:{address}", limit, seconds, 1)]
    if email:
        limits.append((f"auth-account:{bucket}:{normalize_email(email)}", max(limit, 10) if bucket == "login" else limit, seconds, 1))
    enforce_budgets(db, limits)


def get_current_user(request: Request, credentials: HTTPAuthorizationCredentials | None = Depends(bearer), db: Session = Depends(get_db)) -> User:
    if not credentials:
        raise HTTPException(status_code=401, detail="Sign in required")
    try:
        claims = decode_access_token(credentials.credentials)
    except jwt.InvalidTokenError as exc:
        raise HTTPException(status_code=401, detail="Session expired") from exc
    session = db.scalar(select(RefreshSession).where(RefreshSession.id == claims["sid"], RefreshSession.user_id == claims["sub"], RefreshSession.revoked_at.is_(None), RefreshSession.expires_at > now_utc()))
    user = db.get(User, claims["sub"]) if session else None
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Account unavailable")
    request.state.auth_time = claims["auth_time"]
    enforce_budgets(db, [(f"member-requests:{user.id}", 120, 60, 1)])
    return user


def issue_session(db: Session, user: User, expires_at: datetime | None = None, authenticated_at: datetime | None = None) -> AuthResponse:
    now = now_utc()
    # Serialize session creation/reset/rotation for this member on PostgreSQL.
    db.scalar(select(User.id).where(User.id == user.id).with_for_update())
    db.execute(
        delete(RefreshSession).where(
            RefreshSession.user_id == user.id,
            or_(RefreshSession.revoked_at.is_not(None), RefreshSession.expires_at <= now),
        )
    )
    active = list(db.scalars(select(RefreshSession).where(RefreshSession.user_id == user.id).order_by(RefreshSession.created_at.desc(), RefreshSession.id.desc())))
    for old in active[9:]:
        db.delete(old)
    raw_refresh = create_refresh_token()
    session_id = str(uuid4())
    authenticated_at = authenticated_at or now
    if authenticated_at.tzinfo is None:
        authenticated_at = authenticated_at.replace(tzinfo=timezone.utc)
    db.add(RefreshSession(id=session_id, user_id=user.id, token_hash=hash_token(raw_refresh), created_at=authenticated_at, expires_at=expires_at or now + timedelta(days=settings.refresh_token_days)))
    db.commit()
    return AuthResponse(access_token=create_access_token(user.id, session_id, authenticated_at), refresh_token=raw_refresh, user=UserResponse.model_validate(user))


def deliver_email_verification(db: Session, user: User) -> bool:
    try:
        enforce_budgets(db, [("outbound-mail-day", 500, 86400, 1), (f"mail-recipient:{user.email}", 4, 3600, 1)])
    except HTTPException:
        return False
    raw_token = create_refresh_token()
    record = db.get(EmailVerification, user.id) or EmailVerification(user_id=user.id)
    if record.verified_at:
        return True
    record.token_hash = hash_token(raw_token)
    record.expires_at = now_utc() + timedelta(hours=24)
    record.sent_at = now_utc()
    db.add(record)
    db.commit()
    try:
        send_email_verification(settings, user.email, raw_token)
        return True
    except Exception as exc:
        logger.warning("verification_delivery_failed error_type=%s", type(exc).__name__)
        record.token_hash = None
        record.expires_at = None
        db.commit()
        return False


@app.get("/health")
def health() -> dict[str, str]:
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except SQLAlchemyError as exc:
        raise HTTPException(status_code=503, detail="Service temporarily unavailable") from exc
    return {"status": "ok"}


@app.get("/config/public")
def public_config(db: Session = Depends(get_db)) -> dict[str, bool | str]:
    return {
        "api_version": API_VERSION,
        "release_commit": os.getenv("RENDER_GIT_COMMIT", "local")[:12],
        "founding_redemption_enabled": settings.founding_redemption_enabled,
        "email_delivery_ready": settings.email_delivery_ready,
        "database_privacy_ready": database_privacy_ready(db),
    }


@app.post("/auth/register", response_model=AuthResponse, status_code=201)
def register(payload: RegisterRequest, request: Request, db: Session = Depends(get_db)) -> AuthResponse:
    auth_budget(request, db, "register", str(payload.email))
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
        if payload.usage_analytics_opt_in:
            db.add(UsageAnalyticsConsent(user_id=user.id))
        if payload.usage_analytics_opt_in and payload.signup_elapsed_seconds is not None:
            db.add(ProgressEvent(user_id=user.id, client_event_id="signup:completed", event_type="signup_completed", skill_slug="onboarding", value=0, minutes=0, event_metadata={"elapsed_seconds": payload.signup_elapsed_seconds}))
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Account could not be created") from exc
    db.refresh(user)
    session = issue_session(db, user)
    session.verification_email_sent = deliver_email_verification(db, user)
    return session


@app.post("/auth/login", response_model=AuthResponse)
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)) -> AuthResponse:
    auth_budget(request, db, "login", str(payload.email))
    user = db.scalar(select(User).where(User.email == normalize_email(str(payload.email))).with_for_update())
    password_matches = verify_password(payload.password, user.password_hash if user else DUMMY_PASSWORD_HASH)
    if not user or not password_matches:
        raise HTTPException(status_code=401, detail="Email or password is incorrect")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")
    return issue_session(db, user)


@app.post("/auth/refresh", response_model=AuthResponse)
def refresh(payload: RefreshRequest, request: Request, db: Session = Depends(get_db)) -> AuthResponse:
    auth_budget(request, db, "refresh", limit=30)
    token_hash = hash_token(payload.refresh_token)
    claimed_at = now_utc()
    old = db.scalar(select(RefreshSession).where(RefreshSession.token_hash == token_hash))
    if not old:
        raise HTTPException(status_code=401, detail="Refresh session expired")
    db.scalar(select(User.id).where(User.id == old.user_id).with_for_update())
    authenticated_at = old.created_at.replace(tzinfo=timezone.utc) if old.created_at.tzinfo is None else old.created_at
    next_refresh = create_refresh_token()
    user_id = db.scalar(update(RefreshSession).where(RefreshSession.token_hash == token_hash, RefreshSession.revoked_at.is_(None), RefreshSession.expires_at > claimed_at).values(token_hash=hash_token(next_refresh)).execution_options(synchronize_session=False).returning(RefreshSession.user_id))
    if not user_id:
        raise HTTPException(status_code=401, detail="Refresh session expired")
    user = db.get(User, user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Account unavailable")
    db.commit()
    return AuthResponse(access_token=create_access_token(user.id, old.id, authenticated_at), refresh_token=next_refresh, user=UserResponse.model_validate(user))


@app.post("/auth/logout", status_code=204)
def logout(payload: RefreshRequest, request: Request, credentials: HTTPAuthorizationCredentials | None = Depends(bearer), db: Session = Depends(get_db)) -> Response:
    auth_budget(request, db, "logout", limit=30)
    session = db.scalar(select(RefreshSession).where(RefreshSession.token_hash == hash_token(payload.refresh_token)))
    if credentials:
        try:
            claims = decode_access_token(credentials.credentials)
            session = db.scalar(select(RefreshSession).where(RefreshSession.id == claims["sid"], RefreshSession.user_id == claims["sub"]))
        except jwt.InvalidTokenError:
            pass
    if session and not session.revoked_at:
        session.revoked_at = now_utc()
        db.commit()
    return Response(status_code=204)


@app.post("/auth/password-reset/request", status_code=202)
def request_password_reset(payload: PasswordResetRequest, request: Request, db: Session = Depends(get_db)) -> dict[str, str]:
    auth_budget(request, db, "password-reset-request", str(payload.email), limit=4, seconds=900)
    user = db.scalar(select(User).where(User.email == normalize_email(str(payload.email))))
    if user and user.is_active:
        try:
            enforce_budgets(db, [("outbound-mail-day", 500, 86400, 1), (f"mail-recipient:{user.email}", 4, 3600, 1)])
        except HTTPException:
            return {"message": "If that address has an active RISE account, reset instructions will be sent."}
        raw_token = create_refresh_token()
        db.execute(delete(PasswordResetToken).where(PasswordResetToken.user_id == user.id, PasswordResetToken.used_at.is_(None)))
        db.add(PasswordResetToken(user_id=user.id, token_hash=hash_token(raw_token), expires_at=now_utc() + timedelta(minutes=30)))
        db.commit()
        try:
            send_password_reset(settings, user.email, raw_token)
        except Exception:
            # Never disclose account existence or mail-provider details to the caller.
            db.execute(delete(PasswordResetToken).where(PasswordResetToken.user_id == user.id, PasswordResetToken.token_hash == hash_token(raw_token)))
            db.commit()
    return {"message": "If that address has an active RISE account, reset instructions will be sent."}


@app.post("/auth/password-reset/confirm", status_code=204)
def confirm_password_reset(payload: PasswordResetConfirm, request: Request, db: Session = Depends(get_db)) -> Response:
    auth_budget(request, db, "password-reset-confirm", limit=8, seconds=900)
    claimed_at = now_utc()
    user_id = db.scalar(update(PasswordResetToken).where(PasswordResetToken.token_hash == hash_token(payload.token), PasswordResetToken.used_at.is_(None), PasswordResetToken.expires_at > claimed_at).values(used_at=claimed_at).returning(PasswordResetToken.user_id))
    if not user_id:
        raise HTTPException(status_code=400, detail="This reset link is invalid or expired")
    user = db.get(User, user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=400, detail="This reset link is invalid or expired")
    db.scalar(select(User.id).where(User.id == user.id).with_for_update())
    user.password_hash = hash_password(payload.new_password)
    db.execute(update(RefreshSession).where(RefreshSession.user_id == user.id, RefreshSession.revoked_at.is_(None)).values(revoked_at=now_utc()))
    db.commit()
    return Response(status_code=204)


@app.get("/users/me/email-verification")
def email_verification_status(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict[str, bool]:
    record = db.get(EmailVerification, user.id)
    return {"verified": bool(record and record.verified_at)}


@app.post("/users/me/email-verification", status_code=202)
def request_email_verification(request: Request, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict[str, str]:
    auth_budget(request, db, "email-verification", user.email, limit=4, seconds=3600)
    if not deliver_email_verification(db, user):
        raise HTTPException(status_code=503, detail="RISE could not send the verification email. Please try again shortly or contact support.")
    return {"message": "If verification is still needed, a new link will be sent."}


@app.post("/auth/email-verification/confirm", status_code=204)
def confirm_email_verification(payload: EmailVerificationConfirm, request: Request, db: Session = Depends(get_db)) -> Response:
    auth_budget(request, db, "email-verification-confirm", limit=8, seconds=900)
    claimed_at = now_utc()
    user_id = db.scalar(update(EmailVerification).where(EmailVerification.token_hash == hash_token(payload.token), EmailVerification.verified_at.is_(None), EmailVerification.expires_at > claimed_at).values(verified_at=claimed_at, token_hash=None, expires_at=None).returning(EmailVerification.user_id))
    if not user_id:
        raise HTTPException(status_code=400, detail="This verification link is invalid or expired")
    db.commit()
    return Response(status_code=204)


@app.get("/users/me", response_model=UserResponse)
def me(user: User = Depends(get_current_user)) -> User:
    return user


@app.post("/users/me/founding-claim", response_model=UserResponse)
def claim_founding(payload: FoundingClaimRequest, request: Request, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
    enforce_rate_limit(request, "founding-claim", limit=6)
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


def require_recent_auth(request: Request) -> None:
    if now_utc().timestamp() - request.state.auth_time > 900:
        raise HTTPException(428, "For your privacy, sign out and sign in again before exporting or deleting your account.")


@app.delete("/users/me", status_code=204)
def delete_me(request: Request, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Response:
    require_recent_auth(request)
    db.execute(delete(FoundingInvite).where(or_(FoundingInvite.claimed_by_user_id == user.id, FoundingInvite.email == user.email)))
    db.execute(delete(RefreshSession).where(RefreshSession.user_id == user.id))
    db.execute(delete(PasswordResetToken).where(PasswordResetToken.user_id == user.id))
    db.execute(delete(EmailVerification).where(EmailVerification.user_id == user.id))
    db.execute(delete(ProgressEvent).where(ProgressEvent.user_id == user.id))
    db.execute(delete(UserSkill).where(UserSkill.user_id == user.id))
    db.execute(delete(LeaderboardConsent).where(LeaderboardConsent.user_id == user.id))
    db.execute(delete(UsageAnalyticsConsent).where(UsageAnalyticsConsent.user_id == user.id))
    db.execute(delete(ProductFeedback).where(ProductFeedback.user_id == user.id))
    db.execute(delete(UserProfile).where(UserProfile.user_id == user.id))
    db.delete(user)
    db.commit()
    return Response(status_code=204)


@app.get("/users/me/export")
def export_me(request: Request, page: int | None = Query(default=None, ge=0, le=10_000), user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    require_recent_auth(request)
    limits = [(f"export-pages:{user.id}", 120, 3600, 1)]
    if not page:
        limits.append((f"export:{user.id}", 6, 3600, 1))
    enforce_budgets(db, limits)
    offset = (page or 0) * 500
    profile = db.get(UserProfile, user.id)
    skills = list(db.scalars(select(UserSkill).where(UserSkill.user_id == user.id).order_by(UserSkill.id).offset(offset).limit(501)))
    events = list(db.scalars(select(ProgressEvent).where(ProgressEvent.user_id == user.id).order_by(ProgressEvent.created_at, ProgressEvent.id).offset(offset).limit(501)))
    feedback = list(db.scalars(select(ProductFeedback).where(ProductFeedback.user_id == user.id).order_by(ProductFeedback.created_at, ProductFeedback.id).offset(offset).limit(501)))
    more = any(len(items) > 500 for items in (skills, events, feedback))
    if more and page is None:
        raise HTTPException(413, "Update RISE to export this larger archive without truncation.")
    skills, events, feedback = skills[:500], events[:500], feedback[:500]
    founding_invites = list(db.scalars(select(FoundingInvite).where(or_(FoundingInvite.claimed_by_user_id == user.id, FoundingInvite.email == user.email)).order_by(FoundingInvite.created_at)))
    return {
        "exported_at": now_utc().isoformat(),
        "format_version": 2,
        "pagination": {"page": page or 0, "more": more},
        "account": {"id": user.id, "email": user.email, "display_name": user.display_name, "is_founding_member": user.is_founding_member, "founding_expires_at": user.founding_expires_at},
        "founding_invites": [{"id": item.id, "email": item.email, "created_at": item.created_at, "claimed_at": item.claimed_at, "claimed_by_user_id": item.claimed_by_user_id} for item in founding_invites],
        "profile": None if not profile else {"selected_goals": profile.selected_goals, "custom_goal": profile.custom_goal, "weekly_skill": profile.weekly_skill, "focus_skills": profile.focus_skills, "commitment": profile.commitment, "available_time": profile.available_time, "experience": profile.experience, "updated_at": profile.updated_at},
        "skills": [{"skill_slug": item.skill_slug, "selected_at": item.selected_at, "baseline_score": item.baseline_score, "latest_score": item.latest_score, "missions_completed": item.missions_completed, "minutes_logged": item.minutes_logged} for item in skills],
        "progress_events": [{"client_event_id": item.client_event_id, "event_type": item.event_type, "skill_slug": item.skill_slug, "value": item.value, "minutes": item.minutes, "metadata": item.event_metadata, "created_at": item.created_at} for item in events],
        "product_feedback": [{"category": item.category, "rating": item.rating, "message": item.message, "app_version": item.app_version, "created_at": item.created_at} for item in feedback],
    }


@app.post("/feedback", status_code=201)
def submit_feedback(payload: ProductFeedbackCreate, request: Request, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict[str, bool]:
    auth_budget(request, db, "feedback", user.email, limit=8, seconds=3600)
    receipt = db.get(FeedbackSubmissionReceipt, payload.client_feedback_id) if payload.client_feedback_id else None
    if receipt and receipt.user_id != user.id:
        raise HTTPException(status_code=409, detail="Feedback request identifier is unavailable")

    feedback = db.get(ProductFeedback, receipt.feedback_id) if receipt else None
    if receipt and not feedback:
        raise HTTPException(status_code=500, detail="Stored feedback is unavailable")

    if not feedback:
        count = db.scalar(select(func.count()).select_from(ProductFeedback).where(ProductFeedback.user_id == user.id)) or 0
        if count >= 1000:
            raise HTTPException(422, "Stored feedback limit reached. Contact support directly.")
        feedback = ProductFeedback(user_id=user.id, **payload.model_dump(exclude={"client_feedback_id"}))
        db.add(feedback)
        db.flush()
        if payload.client_feedback_id:
            receipt = FeedbackSubmissionReceipt(client_feedback_id=payload.client_feedback_id, user_id=user.id, feedback_id=feedback.id)
            db.add(receipt)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            receipt = db.get(FeedbackSubmissionReceipt, payload.client_feedback_id) if payload.client_feedback_id else None
            if not receipt or receipt.user_id != user.id:
                raise
            feedback = db.get(ProductFeedback, receipt.feedback_id)
            if not feedback:
                raise HTTPException(status_code=500, detail="Stored feedback is unavailable")
        db.refresh(feedback)

    if receipt and receipt.email_notified:
        return {"received": True, "email_notified": True}

    email_notified = True
    try:
        enforce_budgets(db, [("outbound-mail-day", 500, 86400, 1)])
        send_product_feedback_notification(
            settings,
            settings.feedback_inbox,
            feedback_id=feedback.id,
            member_email=user.email,
            category=feedback.category,
            rating=feedback.rating,
            message=feedback.message,
            app_version=feedback.app_version,
            submitted_at=feedback.created_at.isoformat(),
        )
    except Exception as exc:
        email_notified = False
        logger.warning("feedback_delivery_failed error_type=%s", type(exc).__name__)
    if receipt and receipt.email_notified != email_notified:
        receipt.email_notified = email_notified
        db.commit()
    return {"received": True, "email_notified": email_notified}


@app.put("/profiles/me", status_code=204)
def update_profile(payload: ProfileUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Response:
    enforce_budgets(db, [(f"profile:{user.id}", 60, 3600, 1)])
    db.scalar(select(User.id).where(User.id == user.id).with_for_update())
    if payload.focus_skills:
        existing_names = set(db.scalars(select(UserSkill.skill_slug).where(UserSkill.user_id == user.id).limit(201)))
        proposed_names = {"-".join(name.lower().split())[:100] for name in payload.focus_skills}
        if len(existing_names | proposed_names) > 200:
            raise HTTPException(422, "Skill history limit reached. Contact support before adding another skill.")
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


@app.get("/profiles/me", response_model=ProfileResponse | None)
def get_profile(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> UserProfile | None:
    return db.get(UserProfile, user.id)


@app.get("/skills/popular", response_model=list[SkillResponse])
def popular_skills(db: Session = Depends(get_db)) -> list[SkillCatalog]:
    return list(db.scalars(select(SkillCatalog).where(SkillCatalog.active.is_(True)).order_by(SkillCatalog.popularity_rank).limit(12)))


@app.post("/progress/events", status_code=201)
def record_progress(payload: ProgressEventCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict[str, bool]:
    existing = db.scalar(select(ProgressEvent).where(ProgressEvent.user_id == user.id, ProgressEvent.client_event_id == payload.client_event_id))
    if existing:
        return {"created": False}
    limits = [(f"progress-minute:{user.id}", 60, 60, 1), (f"progress-day:{user.id}", 500, 86400, 1), (f"minutes-day:{user.id}", 1440, 86400, payload.minutes)]
    if payload.event_type == "mission_completed":
        limits.append((f"completions-day:{user.id}", 24, 86400, 1))
    enforce_budgets(db, limits)
    db.scalar(select(User.id).where(User.id == user.id).with_for_update())
    # Recheck after taking the member lock so simultaneous retries are harmless.
    if db.scalar(select(ProgressEvent.id).where(ProgressEvent.user_id == user.id, ProgressEvent.client_event_id == payload.client_event_id)):
        return {"created": False}
    event_count = db.scalar(select(func.count()).select_from(ProgressEvent).where(ProgressEvent.user_id == user.id)) or 0
    if event_count >= 10_000:
        raise HTTPException(422, "Stored activity limit reached. Export your records and contact support.")
    event = ProgressEvent(user_id=user.id, client_event_id=payload.client_event_id, event_type=payload.event_type, skill_slug=payload.skill_slug, value=payload.value, minutes=payload.minutes, event_metadata=payload.metadata)
    if payload.event_type in {"app_session", "invite_shared"}:
        if not db.get(UsageAnalyticsConsent, user.id):
            raise HTTPException(status_code=403, detail="Usage analytics is off")
        if payload.event_type == "app_session":
            seconds = payload.metadata.get("duration_seconds")
            if not isinstance(seconds, int) or not 10 <= seconds <= 3600 or payload.minutes != 0:
                raise HTTPException(status_code=422, detail="Invalid app session duration")
        elif payload.metadata or payload.minutes != 0 or payload.value != 0 or payload.skill_slug != "app":
            raise HTTPException(status_code=422, detail="Invalid invite event")
        db.add(event)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            return {"created": False}
        return {"created": True}
    skill = db.scalar(select(UserSkill).where(UserSkill.user_id == user.id, UserSkill.skill_slug == payload.skill_slug))
    if not skill:
        skill_count = db.scalar(select(func.count()).select_from(UserSkill).where(UserSkill.user_id == user.id)) or 0
        if skill_count >= 200:
            raise HTTPException(422, "Skill history limit reached")
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
    enforce_budgets(db, [(f"dashboard:{user.id}", 30, 60, 1)])
    skills = list(db.scalars(select(UserSkill).where(UserSkill.user_id == user.id).order_by(UserSkill.selected_at).limit(200)))
    progress = [SkillProgressResponse(skill_slug=item.skill_slug, baseline_score=item.baseline_score, latest_score=item.latest_score, improvement_points=(item.latest_score - item.baseline_score) if item.latest_score is not None and item.baseline_score is not None else None, missions_completed=item.missions_completed, minutes_logged=item.minutes_logged) for item in skills]
    total_missions = db.scalar(select(func.count()).select_from(ProgressEvent).where(ProgressEvent.user_id == user.id, ProgressEvent.event_type == "mission_completed")) or 0
    total_minutes = db.scalar(select(func.coalesce(func.sum(ProgressEvent.minutes), 0)).where(ProgressEvent.user_id == user.id)) or 0
    return DashboardResponse(user=UserResponse.model_validate(user), skills=progress, total_missions=int(total_missions), total_minutes=int(total_minutes))


def leaderboard_snapshot(db: Session, user: User) -> dict:
    month_start = now_utc().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    # Local/offline proof is self-reported. Do not rank unverified submissions or
    # scan every participant for an ordinary member's request.
    missions = db.scalar(select(func.count()).select_from(ProgressEvent).where(ProgressEvent.user_id == user.id, ProgressEvent.event_type == "mission_completed", ProgressEvent.created_at >= month_start)) or 0
    return {
        "opted_in": db.get(LeaderboardConsent, user.id) is not None,
        "rank": None,
        "participants": 0,
        "ranking_available": False,
        "self_reported": True,
        "missions": int(missions),
        "period": "month",
        "period_start": month_start.date().isoformat(),
    }


@app.get("/users/me/leaderboard")
def my_leaderboard(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    return leaderboard_snapshot(db, user)


@app.get("/users/me/usage-analytics")
def usage_analytics_status(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict[str, bool]:
    return {"opted_in": db.get(UsageAnalyticsConsent, user.id) is not None}


@app.put("/users/me/usage-analytics")
def opt_in_usage_analytics(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict[str, bool]:
    if not db.get(UsageAnalyticsConsent, user.id):
        db.add(UsageAnalyticsConsent(user_id=user.id))
        db.commit()
    return {"opted_in": True}


@app.delete("/users/me/usage-analytics")
def opt_out_usage_analytics(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict[str, bool]:
    db.execute(delete(UsageAnalyticsConsent).where(UsageAnalyticsConsent.user_id == user.id))
    db.execute(delete(ProgressEvent).where(ProgressEvent.user_id == user.id, ProgressEvent.event_type.in_(["app_session", "signup_completed", "invite_shared"])))
    db.commit()
    return {"opted_in": False}


@app.put("/users/me/leaderboard")
def opt_in_leaderboard(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    # Compatibility response for older clients; do not enroll new comparisons.
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
    consented_user_ids = set(db.scalars(select(UsageAnalyticsConsent.user_id)))
    events = list(db.scalars(select(ProgressEvent).where(ProgressEvent.user_id.in_(consented_user_ids)))) if consented_user_ids else []
    event_by_user: dict[str, list[ProgressEvent]] = defaultdict(list)
    for event in events:
        event_by_user[event.user_id].append(event)
    now = now_utc()
    signups = [event.event_metadata.get("elapsed_seconds") for event in events if event.event_type == "signup_completed" and isinstance(event.event_metadata.get("elapsed_seconds"), int)]
    feedback_counts = dict(db.execute(select(ProductFeedback.category, func.count()).group_by(ProductFeedback.category)).all())
    members = []
    first_mission_start_delays = []
    first_mission_delays = []
    for user in users:
        if user.id not in consented_user_ids:
            continue
        user_events = event_by_user[user.id]
        mission_starts = [event for event in user_events if event.event_type == "mission_started"]
        missions = [event for event in user_events if event.event_type == "mission_completed"]
        minutes = sum(event.minutes for event in user_events)
        app_seconds = sum(event.event_metadata.get("duration_seconds", 0) for event in user_events if event.event_type == "app_session")
        first_mission_start = min((event.created_at for event in mission_starts), default=None)
        first_mission = min((event.created_at for event in missions), default=None)
        if first_mission_start:
            first_mission_start_delays.append(max(0, (first_mission_start.replace(tzinfo=timezone.utc) - user.created_at.replace(tzinfo=timezone.utc)).total_seconds() / 60))
        if first_mission:
            first_mission_delays.append(max(0, (first_mission.replace(tzinfo=timezone.utc) - user.created_at.replace(tzinfo=timezone.utc)).total_seconds() / 60))
        last_activity = max((event.created_at for event in user_events), default=None)
        members.append({"user_id": user.id, "joined_at": user.created_at, "missions_started": len(mission_starts), "missions_completed": len(missions), "focused_minutes": minutes, "app_minutes": round(app_seconds / 60, 1), "active_days": len({event.created_at.date() for event in user_events}), "last_activity_at": last_activity})
    members.sort(key=lambda member: (-member["missions_completed"], -member["focused_minutes"]))
    members_who_started = sum(member["missions_started"] > 0 for member in members)
    members_who_completed = sum(member["missions_completed"] > 0 for member in members)
    def retention_window(start_day: int) -> dict[str, int | float | None]:
        end_day = start_day + 1
        eligible = [user for user in users if user.id in consented_user_ids and user.created_at.replace(tzinfo=timezone.utc) <= now - timedelta(days=end_day)]
        retained = sum(
            any(
                user.created_at.replace(tzinfo=timezone.utc) + timedelta(days=start_day)
                <= event.created_at.replace(tzinfo=timezone.utc)
                < user.created_at.replace(tzinfo=timezone.utc) + timedelta(days=end_day)
                for event in event_by_user[user.id]
            )
            for user in eligible
        )
        return {"eligible_members": len(eligible), "retained_members": retained, "rate_percent": round((retained / len(eligible)) * 100, 1) if eligible else None}

    feedback_email_pending = db.scalar(select(func.count()).select_from(FeedbackSubmissionReceipt).where(FeedbackSubmissionReceipt.email_notified.is_(False))) or 0
    invite_events = [event for event in events if event.event_type == "invite_shared"]
    return {"total_members": len(users), "analytics_participants": len(consented_user_ids), "active_last_7_days": len({event.user_id for event in events if event.created_at.replace(tzinfo=timezone.utc) >= now - timedelta(days=7)}), "retention": {"day_1": retention_window(1), "day_7": retention_window(7), "day_30": retention_window(30)}, "members_with_mission_started": members_who_started, "members_with_mission": members_who_completed, "mission_start_completion_rate_percent": round((members_who_completed / members_who_started) * 100, 1) if members_who_started else None, "total_missions": sum(member["missions_completed"] for member in members), "total_focused_minutes": sum(member["focused_minutes"] for member in members), "total_app_minutes": round(sum(member["app_minutes"] for member in members), 1), "average_signup_seconds": round(sum(signups) / len(signups)) if signups else None, "average_minutes_to_first_mission_start": round(sum(first_mission_start_delays) / len(first_mission_start_delays)) if first_mission_start_delays else None, "average_minutes_to_first_mission": round(sum(first_mission_delays) / len(first_mission_delays)) if first_mission_delays else None, "invite_shares": len(invite_events), "members_who_shared": len({event.user_id for event in invite_events}), "feedback_total": sum(feedback_counts.values()), "feedback_by_category": feedback_counts, "feedback_email_pending": int(feedback_email_pending), "members": members[:100]}
