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



def test_postgres_migration_protects_private_tables() -> None:
    import os
    import pytest
    from sqlalchemy import text
    from sqlalchemy.orm import Session
    from app.database_privacy import database_privacy_ready
    url = os.environ.get("RISE_TEST_POSTGRES_URL")
    if not url:
        pytest.skip("Isolated PostgreSQL is provided by CI")
    # This URL is exclusively the disposable CI database, never production.
    engine = create_engine(url)
    upgrade_database(url)
    with Session(engine) as db:
        assert database_privacy_ready(db)
        db.execute(text('GRANT SELECT ON TABLE users TO PUBLIC'))
        db.commit()
        assert not database_privacy_ready(db)
        db.execute(text('REVOKE SELECT ON TABLE users FROM PUBLIC'))
        db.commit()
        assert database_privacy_ready(db)
    engine.dispose()
