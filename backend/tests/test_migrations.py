from pathlib import Path

from sqlalchemy import create_engine, inspect

from app.migrations import upgrade_database


def test_database_migrations_are_idempotent(tmp_path: Path) -> None:
    database = tmp_path / "migrated.db"
    database_url = f"sqlite:///{database.as_posix()}"
    upgrade_database(database_url)
    upgrade_database(database_url)

    tables = set(inspect(create_engine(database_url)).get_table_names())
    assert "alembic_version" in tables
    assert {"users", "progress_events", "product_feedback", "feedback_submission_receipts"} <= tables
