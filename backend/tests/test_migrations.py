from pathlib import Path

from sqlalchemy import create_engine, inspect

from app.migrations import upgrade_database


def test_database_migrations_are_idempotent(tmp_path: Path) -> None:
    database = tmp_path / "migrated.db"
    database_url = f"sqlite:///{database.as_posix()}"
    upgrade_database(database_url)
    upgrade_database(database_url)

    inspector = inspect(create_engine(database_url))
    tables = set(inspector.get_table_names())
    assert "alembic_version" in tables
    assert {"users", "progress_events", "product_feedback", "feedback_submission_receipts"} <= tables
    progress_indexes = {index["name"] for index in inspector.get_indexes("progress_events")}
    session_indexes = {index["name"] for index in inspector.get_indexes("refresh_sessions")}
    assert {"ix_progress_events_user_type_created", "ix_progress_events_user_created"} <= progress_indexes
    assert "ix_refresh_sessions_user_state" in session_indexes
