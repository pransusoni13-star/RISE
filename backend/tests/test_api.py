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
    settings = Settings(env="production", jwt_secret="a-strong-production-secret-at-least-32", database_url="postgresql+psycopg://rise:password@db/rise", allowed_origins="https://rise.example", admin_api_key="test-admin-key-long-enough-for-a-test-123")
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
