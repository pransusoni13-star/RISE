"""Check the precise RISE tables that must never be client/Data API accessible."""
from sqlalchemy import text
from sqlalchemy.orm import Session

PRIVATE_TABLES = (
    "users", "refresh_sessions", "password_reset_tokens", "email_verifications",
    "user_profiles", "user_skills", "progress_events", "leaderboard_consents",
    "usage_analytics_consents", "product_feedback", "feedback_submission_receipts",
    "founding_invites", "request_budgets",
)


def database_privacy_ready(db: Session) -> bool:
    if db.get_bind().dialect.name != "postgresql":
        return False
    rows = db.execute(text("""
        SELECT c.relname, c.relrowsecurity,
          EXISTS (
            SELECT 1 FROM aclexplode(COALESCE(c.relacl, acldefault('r', c.relowner))) acl
            LEFT JOIN pg_roles r ON r.oid = acl.grantee
            WHERE acl.grantee = 0 OR r.rolname IN ('anon', 'authenticated')
          ) AS client_grant
        FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = current_schema() AND c.relkind = 'r'
    """)).all()
    tables = {row[0]: row for row in rows}
    return all(name in tables and tables[name][1] and not tables[name][2] for name in PRIVATE_TABLES)
