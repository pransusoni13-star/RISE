"""Adopt the current RISE schema as the migration baseline.

This intentionally uses create_all once so an existing beta database is stamped
without destructive recreation while a new database receives the same schema.
Every schema change after this revision must use explicit Alembic operations.
"""
from typing import Sequence

from alembic import op

from app.database import Base
from app import models  # noqa: F401 - registers every table on Base.metadata


revision: str = "0001_current_schema"
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    Base.metadata.create_all(bind=op.get_bind())


def downgrade() -> None:
    # The adoption revision must never delete an existing production database.
    pass
