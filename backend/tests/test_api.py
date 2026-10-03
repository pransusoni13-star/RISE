import os
from pathlib import Path

TEST_DB = Path(__file__).with_name("test-rise.db")
os.environ["RISE_DATABASE_URL"] = f"sqlite:///{TEST_DB.as_posix()}"
os.environ["RISE_JWT_SECRET"] = "test-secret-that-is-long-enough-for-tests-12345"

from fastapi.testclient import TestClient
from sqlalchemy.exc import OperationalError

from app.database import Base, SessionLocal, engine
from app.config import Settings
from app.main import app, settings, attempts, attempt_lock
from app.models import FoundingInvite
from app.security import hash_token


def test_health_checks_database(monkeypatch) -> None:
    with TestClient(app) as client:
        assert client.get("/health").json() == {"status": "ok"}

        def unavailable():
            raise OperationalError("SELECT 1", {}, RuntimeError("database unavailable"))

        monkeypatch.setattr(engine, "connect", unavailable)
        response = client.get("/health")
        assert response.status_code == 503
        assert response.json() == {"detail": "Service temporarily unavailable"}


def test_registration_rejects_whitespace_display_names() -> None:
    with TestClient(app) as client:
        for name in ["   ", " a "]:
            response = client.post("/auth/register", json={"email": "blank@example.com", "password": "very-secure-password", "display_name": name})
            assert response.status_code == 422


def test_password_reset_is_private_single_use_and_revokes_sessions(monkeypatch) -> None:
    delivered: dict[str, str] = {}

    def capture_reset(_settings, recipient: str, token: str) -> None:
        delivered.update(recipient=recipient, token=token)

    monkeypatch.setattr("app.main.send_password_reset", capture_reset)
    with TestClient(app) as client:
        created = client.post("/auth/register", json={"email": "reset@example.com", "password": "original-password", "display_name": "Reset Member"})
        assert created.status_code == 201
        old_access = created.json()["access_token"]
        generic = {"message": "If that address has an active RISE account, reset instructions will be sent."}
        assert client.post("/auth/password-reset/request", json={"email": "missing@example.com"}).json() == generic
        assert client.post("/auth/password-reset/request", json={"email": "RESET@example.com"}).json() == generic
        assert delivered["recipient"] == "reset@example.com"

        changed = client.post("/auth/password-reset/confirm", json={"token": delivered["token"], "new_password": "replacement-password"})
        assert changed.status_code == 204
        assert client.post("/auth/password-reset/confirm", json={"token": delivered["token"], "new_password": "another-password"}).status_code == 400
        assert client.post("/auth/login", json={"email": "reset@example.com", "password": "original-password"}).status_code == 401
        assert client.post("/auth/login", json={"email": "reset@example.com", "password": "replacement-password"}).status_code == 200
        assert client.get("/users/me", headers={"Authorization": f"Bearer {old_access}"}).status_code == 200
        old_refresh = created.json()["refresh_token"]
        assert client.post("/auth/refresh", json={"refresh_token": old_refresh}).status_code == 401


def test_email_verification_is_expiring_and_single_use(monkeypatch) -> None:
    delivered: dict[str, str] = {}

    def capture_verification(_settings, recipient: str, token: str) -> None:
        delivered.update(recipient=recipient, token=token)

    monkeypatch.setattr("app.main.send_email_verification", capture_verification)
    with TestClient(app) as client:
        created = client.post("/auth/register", json={"email": "verify@example.com", "password": "very-secure-password", "display_name": "Verify Member"})
        assert created.status_code == 201
        headers = {"Authorization": f"Bearer {created.json()['access_token']}"}
        assert delivered["recipient"] == "verify@example.com"
        assert client.get("/users/me/email-verification", headers=headers).json() == {"verified": False}
        assert client.post("/auth/email-verification/confirm", json={"token": delivered["token"]}).status_code == 204
        assert client.get("/users/me/email-verification", headers=headers).json() == {"verified": True}
        assert client.post("/auth/email-verification/confirm", json={"token": delivered["token"]}).status_code == 400


def test_progress_is_isolated_between_accounts() -> None:
    with TestClient(app) as client:
        headers = []
        for email in ["first@example.com", "second@example.com"]:
            response = client.post("/auth/register", json={"email": email, "password": "very-secure-password", "display_name": "Test Member"})
            assert response.status_code == 201
            headers.append({"Authorization": f"Bearer {response.json()['access_token']}"})
        event = {"client_event_id": "mission:isolation", "event_type": "mission_completed", "skill_slug": "coding"}
        assert client.post("/progress/events", json=event).status_code == 401
        assert client.post("/progress/events", json=event, headers=headers[0]).status_code == 201
        assert client.get("/users/me/dashboard", headers=headers[0]).json()["total_missions"] == 1
        assert client.get("/users/me/dashboard", headers=headers[1]).json()["total_missions"] == 0
        assert client.get("/users/me/export", headers=headers[1]).json()["progress_events"] == []


def test_profiles_are_private_and_can_be_restored() -> None:
    with TestClient(app) as client:
        sessions = [client.post("/auth/register", json={"email": f"profile-{number}@example.com", "password": "very-secure-password", "display_name": f"Member {number}"}).json() for number in (1, 2)]
        headers = [{"Authorization": f"Bearer {session['access_token']}"} for session in sessions]
        assert client.get("/profiles/me", headers=headers[0]).json() is None
        plan = {"selected_goals": ["software-engineer", "fitness"], "custom_goal": "Build an app and run farther", "weekly_skill": "React Native", "focus_skills": ["React Native", "Running", "Communication"], "commitment": "Every 10 days", "available_time": "30 minutes", "experience": "beginner"}
        assert client.put("/profiles/me", json=plan, headers=headers[0]).status_code == 204
        assert client.get("/profiles/me", headers=headers[0]).json() == plan
        assert client.get("/profiles/me", headers=headers[1]).json() is None


def setup_function() -> None:
    with attempt_lock:
        attempts.clear()
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        db.add(FoundingInvite(email="founder@example.com", code_hash=hash_token("FOUNDING-ONE")))
        db.commit()


def teardown_module() -> None:
    engine.dispose()
    TEST_DB.unlink(missing_ok=True)


def test_founding_registration_and_progress_are_idempotent(monkeypatch) -> None:
    monkeypatch.setattr(settings, "founding_redemption_enabled", True)
    with TestClient(app) as client:
        response = client.post("/auth/register", json={"email": "Founder@Example.com", "password": "very-secure-password", "display_name": "First Founder", "founding_code": "FOUNDING-ONE"})
        assert response.status_code == 201
        session = response.json()
        assert session["user"]["is_founding_member"] is True
        headers = {"Authorization": f"Bearer {session['access_token']}"}
        event = {"client_event_id": "quiz:first", "event_type": "quiz_completed", "skill_slug": "react-native", "value": 60, "minutes": 20, "metadata": {}}
        assert client.post("/progress/events", json=event, headers=headers).json() == {"created": True}
        assert client.post("/progress/events", json=event, headers=headers).json() == {"created": False}
        event["client_event_id"] = "quiz:second"
        event["value"] = 90
        assert client.post("/progress/events", json=event, headers=headers).status_code == 201
        dashboard = client.get("/users/me/dashboard", headers=headers).json()
        assert dashboard["skills"][0]["improvement_points"] == 30
        assert client.get("/users/me/leaderboard", headers=headers).json()["opted_in"] is False
        assert client.put("/users/me/leaderboard", headers=headers).json()["rank"] == 1
        assert client.delete("/users/me/leaderboard", headers=headers).json()["opted_in"] is False
        export = client.get("/users/me/export", headers=headers)
        assert export.status_code == 200
        assert export.json()["account"]["email"] == "founder@example.com"
        assert len(export.json()["progress_events"]) == 2
        assert client.delete("/users/me", headers=headers).status_code == 204
        assert client.get("/users/me", headers=headers).status_code == 401


def test_invite_cannot_be_claimed_by_another_email(monkeypatch) -> None:
    monkeypatch.setattr(settings, "founding_redemption_enabled", True)
    with TestClient(app) as client:
        response = client.post("/auth/register", json={"email": "other@example.com", "password": "very-secure-password", "display_name": "Other User", "founding_code": "FOUNDING-ONE"})
        assert response.status_code == 400


def test_login_attempts_are_rate_limited() -> None:
    with TestClient(app) as client:
        payload = {"email": "unknown@example.com", "password": "incorrect-password"}
        for _ in range(6):
            assert client.post("/auth/login", json=payload).status_code == 401
        assert client.post("/auth/login", json=payload).status_code == 429


def test_founding_claims_wait_for_public_launch_and_analytics_are_private(monkeypatch) -> None:
    with TestClient(app) as client:
        assert client.get("/config/public").json()["founding_redemption_enabled"] is False
        blocked = client.post("/auth/register", json={"email": "founder@example.com", "password": "very-secure-password", "display_name": "First Founder", "founding_code": "FOUNDING-ONE"})
        assert blocked.status_code == 403
        response = client.post("/auth/register", json={"email": "founder@example.com", "password": "very-secure-password", "display_name": "First Founder", "signup_elapsed_seconds": 48, "usage_analytics_opt_in": True})
        assert response.status_code == 201
        headers = {"Authorization": f"Bearer {response.json()['access_token']}"}
        session_event = {"client_event_id": "session:first", "event_type": "app_session", "skill_slug": "app", "metadata": {"duration_seconds": 120}}
        assert client.post("/progress/events", json=session_event, headers=headers).status_code == 201
        assert client.post("/progress/events", json=session_event, headers=headers).json() == {"created": False}
        assert client.get("/users/me/dashboard", headers=headers).json()["skills"] == []
        assert client.post("/users/me/founding-claim", json={"founding_code": "FOUNDING-ONE"}, headers=headers).status_code == 403
        assert client.get("/admin/analytics").status_code == 403
        monkeypatch.setattr(settings, "founding_redemption_enabled", True)
        assert client.post("/users/me/founding-claim", json={"founding_code": "FOUNDING-ONE"}, headers=headers).json()["is_founding_member"] is True
        monkeypatch.setattr(settings, "admin_api_key", "test-admin-key-long-enough-for-a-test-123")
        analytics = client.get("/admin/analytics", headers={"X-RISE-ADMIN-KEY": settings.admin_api_key}).json()
        assert analytics["total_members"] == 1
        assert analytics["analytics_participants"] == 1
        assert analytics["average_signup_seconds"] == 48
        assert analytics["total_app_minutes"] == 2.0
        assert analytics["total_focused_minutes"] == 0
        assert client.delete("/users/me/usage-analytics", headers=headers).json() == {"opted_in": False}
        assert client.get("/admin/analytics", headers={"X-RISE-ADMIN-KEY": settings.admin_api_key}).json()["analytics_participants"] == 0
        assert client.post("/progress/events", json={**session_event, "client_event_id": "session:second"}, headers=headers).status_code == 403
        assert client.put("/users/me/usage-analytics", headers=headers).json() == {"opted_in": True}
        assert client.get("/admin/analytics", headers={"X-RISE-ADMIN-KEY": settings.admin_api_key}).json()["total_app_minutes"] == 0


def test_production_settings_require_private_database_and_https_origin() -> None:
    settings = Settings(env="production", jwt_secret="a-strong-production-secret-at-least-32", database_url="sqlite:///./local.db", allowed_origins="https://rise.example")
    try:
        settings.validate_for_startup()
        assert False, "production SQLite should be rejected"
    except RuntimeError as error:
        assert "PostgreSQL" in str(error)
    settings = Settings(env="production", jwt_secret="a-strong-production-secret-at-least-32", database_url="postgresql+psycopg://rise:password@db/rise", allowed_origins="https://rise.example", admin_api_key="test-admin-key-long-enough-for-a-test-123", public_app_url="https://rise.example", smtp_host="smtp.example", smtp_username="rise", smtp_password="private-test-password", smtp_from_email="support@rise.example")
    settings.validate_for_startup()
    assert settings.cors_origins == ["https://rise.example"]


def test_usage_analytics_requires_opt_in_and_metadata_is_bounded() -> None:
    with TestClient(app) as client:
        session = client.post("/auth/register", json={"email": "private@example.com", "password": "very-secure-password", "display_name": "Private User", "signup_elapsed_seconds": 20}).json()
        headers = {"Authorization": f"Bearer {session['access_token']}"}
        assert client.get("/users/me/usage-analytics", headers=headers).json() == {"opted_in": False}
        event = {"client_event_id": "session:private", "event_type": "app_session", "skill_slug": "app", "metadata": {"duration_seconds": 60}}
        assert client.post("/progress/events", json=event, headers=headers).status_code == 403
        assert client.post("/progress/events", json={**event, "event_type": "mission_completed", "metadata": {"note": "x" * 3000}}, headers=headers).status_code == 422
        assert client.put("/users/me/usage-analytics", headers=headers).json() == {"opted_in": True}
        assert client.post("/progress/events", json=event, headers=headers).status_code == 201
        assert client.delete("/users/me/usage-analytics", headers=headers).json() == {"opted_in": False}
        assert all(item["event_type"] != "app_session" for item in client.get("/users/me/export", headers=headers).json()["progress_events"])


def test_feedback_is_authenticated_emailed_exported_and_deleted(monkeypatch) -> None:
    delivered: dict[str, object] = {}

    def capture_feedback(_settings, recipient: str, **details) -> None:
        delivered.update(recipient=recipient, **details)

    monkeypatch.setattr("app.main.send_product_feedback_notification", capture_feedback)
    with TestClient(app) as client:
        session = client.post("/auth/register", json={"email": "feedback@example.com", "password": "very-secure-password", "display_name": "Feedback Member"}).json()
        headers = {"Authorization": f"Bearer {session['access_token']}"}
        payload = {"category": "accessibility", "rating": 4, "message": "The larger text setting needs more room on the mission screen.", "app_version": "1.0.0"}
        assert client.post("/feedback", json=payload).status_code == 401
        assert client.post("/feedback", json={**payload, "rating": 9}, headers=headers).status_code == 422
        assert client.post("/feedback", json=payload, headers=headers).json() == {"received": True, "email_notified": True}
        assert delivered["recipient"] == "rise.app13@gmail.com"
        assert delivered["member_email"] == "feedback@example.com"
        assert delivered["message"] == payload["message"]
        exported = client.get("/users/me/export", headers=headers).json()
        assert exported["product_feedback"][0]["category"] == "accessibility"
        assert client.delete("/users/me", headers=headers).status_code == 204


def test_feedback_remains_saved_when_support_email_fails(monkeypatch) -> None:
    def unavailable(*_args, **_kwargs) -> None:
        raise RuntimeError("mail provider unavailable")

    monkeypatch.setattr("app.main.send_product_feedback_notification", unavailable)
    with TestClient(app) as client:
        session = client.post("/auth/register", json={"email": "feedback-fallback@example.com", "password": "very-secure-password", "display_name": "Feedback Fallback"}).json()
        headers = {"Authorization": f"Bearer {session['access_token']}"}
        payload = {"category": "bug", "rating": 2, "message": "The mission button did not respond on my first tap.", "app_version": "1.0.0"}
        assert client.post("/feedback", json=payload, headers=headers).json() == {"received": True, "email_notified": False}
        exported = client.get("/users/me/export", headers=headers).json()
        assert exported["product_feedback"][0]["message"] == payload["message"]
