"""Add indexes used by session cleanup, dashboards, and retention queries."""

from typing import Sequence

from alembic import op
from sqlalchemy import inspect


revision: str = "0002_scale_query_indexes"
down_revision: str | Sequence[str] | None = "0001_current_schema"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


INDEXES = (
    ("refresh_sessions", "ix_refresh_sessions_user_state", ["user_id", "revoked_at", "expires_at"]),
    ("progress_events", "ix_progress_events_user_type_created", ["user_id", "event_type", "created_at"]),
    ("progress_events", "ix_progress_events_user_created", ["user_id", "created_at"]),
)


def _existing_indexes(table_name: str) -> set[str]:
    return {index["name"] for index in inspect(op.get_bind()).get_indexes(table_name)}


def upgrade() -> None:
    # The baseline revision intentionally calls current metadata.create_all for
    # brand-new databases, so guard each operation to support both fresh and
    # already-stamped beta databases safely.
    for table_name, index_name, columns in INDEXES:
        if index_name not in _existing_indexes(table_name):
            op.create_index(index_name, table_name, columns, unique=False)


def downgrade() -> None:
    for table_name, index_name, _columns in reversed(INDEXES):
        if index_name in _existing_indexes(table_name):
            op.drop_index(index_name, table_name=table_name)
