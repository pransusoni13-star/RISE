"""Delete founding-invite privacy residue from previously deleted accounts."""

from typing import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "0003_invite_privacy"
down_revision: str | Sequence[str] | None = "0002_scale_query_indexes"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    founding_invites = sa.table(
        "founding_invites",
        sa.column("claimed_at", sa.DateTime(timezone=True)),
        sa.column("claimed_by_user_id", sa.String(length=36)),
    )
    op.execute(
        founding_invites.delete().where(
            founding_invites.c.claimed_at.is_not(None),
            founding_invites.c.claimed_by_user_id.is_(None),
        )
    )


def downgrade() -> None:
    # Privacy deletions are intentionally irreversible: the removed email and
    # claim association cannot be reconstructed safely.
    pass
