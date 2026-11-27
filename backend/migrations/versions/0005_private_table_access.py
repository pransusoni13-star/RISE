"""Deny direct anonymous/Data API access to RISE's private tables.

The API uses its server database connection, not Supabase client roles. No
customer records are read or changed. No broad schema or unrelated table grants
are changed. Downgrade deliberately does not reopen private data access.
"""
from alembic import op
import sqlalchemy as sa

revision = "0005_private_access"
down_revision = "0004_shared_budgets"
branch_labels = None
depends_on = None

TABLES = (
    "users", "refresh_sessions", "password_reset_tokens", "email_verifications",
    "user_profiles", "user_skills", "progress_events", "leaderboard_consents",
    "usage_analytics_consents", "product_feedback", "feedback_submission_receipts",
    "founding_invites", "request_budgets",
)


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name != "postgresql":
        return
    roles = list(bind.execute(sa.text("SELECT rolname FROM pg_roles WHERE rolname IN ('anon', 'authenticated')")).scalars())
    for name in TABLES:
        # Identifiers are a fixed list maintained with this migration, never input.
        op.execute(sa.text(f'REVOKE ALL PRIVILEGES ON TABLE "{name}" FROM PUBLIC'))
        for role in roles:
            op.execute(sa.text(f'REVOKE ALL PRIVILEGES ON TABLE "{name}" FROM "{role}"'))
        op.execute(sa.text(f'ALTER TABLE "{name}" ENABLE ROW LEVEL SECURITY'))


def downgrade() -> None:
    # Reopening private tables is never an automatic rollback side effect.
    pass
