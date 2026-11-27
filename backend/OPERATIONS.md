# RISE production operations

Verified November 27, 2026. Operational instructions are not evidence that a drill has been executed.

## Current controls

The API runs on Render and its database is on Supabase. `/health` executes a database query. `/config/public` exposes the release commit, email readiness and private-table guard result without credentials. Supabase SSL enforcement is enabled; direct database/pooler access is restricted to both outbound ranges listed by the existing Render service. Database users still require valid credentials. Do not broaden the allowlist to all IPs for convenience. When the service changes region/provider or a direct backup client is added, review its exact egress ranges before the change.

Every protected request checks a revocable session. Durable request budgets live in PostgreSQL; process-local limits are supplemental. RLS and denied anon/authenticated grants protect the thirteen private application tables. Do not give public roles grants as a workaround for API failures: the API owns the authenticated database work.

## Backup and restore gate

The current Supabase Free plan explicitly excludes scheduled project backups. No backup or restore was created during this work. Select one concrete approach before relying on recovery: owner-approved managed backups, or an encrypted external backup process with a documented operator, retention, destination and recovery objective.

For an external approach, use current PostgreSQL-compatible dump/restore tooling, dedicated least-privilege credentials where possible, verified TLS with the provider's CA, and narrow network access for the backup worker. Supply secrets through that worker's supported secret store, never command arguments, Git, app public variables, or logs. Encrypt the backup before writing to the chosen persistent destination. A dump in the repository or on an unprotected laptop is not the intended backup system.

Run the first restore in a separate empty environment, never over production. Verify migrations, constraints and record counts without publishing customer records; ensure authentication and deletion flows work against the restored copy; measure elapsed recovery time. Protect the restored data with the same access controls and retention as production. Record the backup timestamp, artifact checksum, restore duration, result and approved disposal process. The worker/destination, credentials, recovery objectives and first successful drill remain to be supplied or performed; this runbook does not mark them complete.

## Monitoring and incidents

Render's service notification setting currently inherits failure-only notifications. Prove delivery to the responsible operator with an isolated staging event; do not deliberately break production to test it. Configure a chosen monitor for health, elevated 5xx, unusual auth/mail/write rates and storage growth, and prove alert receipt. Record retention and authorized viewers for provider logs.

Keep only minimal security metadata in alerts. Never include passwords, bearer/refresh tokens, email-token URLs, proof media, or private goals/reflections. Review provider access-log query redaction separately. On an actual exposed credential, revoke/rotate the affected credential through its provider, update its consumers, verify the service and inspect relevant sanitized access records. Do not rotate unrelated credentials merely because a scan has limited coverage.

For a failed deployment, identify the exact commit and first failing stage. A code rollback does not reverse database changes. Prefer correcting a forward-compatible failure and verify both database-backed health and release commit after rollout. Preserve evidence and follow applicable incident-notification obligations rather than making unsupported security guarantees.

## Owner access

Vercel showed single-factor authentication. Owner-managed authenticator enrollment and recovery-code custody remain necessary. Review Render, Supabase, GitHub, Expo/EAS, SMTP and Apple administrator membership/MFA and token scopes. Keep App Store review credentials separate from provider administrator credentials. EAS update-publisher permissions and update signing require their own review.
