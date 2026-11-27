"""Shared request budgets; no customer records are changed."""
from alembic import op
import sqlalchemy as sa

revision = "0004_shared_budgets"
down_revision = "0003_invite_privacy"
branch_labels = None
depends_on = None


def upgrade() -> None:
    if not sa.inspect(op.get_bind()).has_table("request_budgets"):
        op.create_table("request_budgets", sa.Column("key", sa.String(100), primary_key=True), sa.Column("used", sa.BigInteger(), nullable=False), sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False))
        op.create_index("ix_request_budgets_expires_at", "request_budgets", ["expires_at"])


def downgrade() -> None:
    op.drop_table("request_budgets")
