# RISE security remediation and Build 26

November 27, 2026. The owner approved implementation following the local audit. Build 26 is the intended candidate; this document does not attest to its upload, device QA, or App Store submission.

## Implemented source changes

- Access JWTs require issuer, audience, expiration, issued-at, type, session ID, and authentication time. Every protected request checks a live session. Logout and reset revoke access as well as refresh. Refresh rotates in place, preserves the original absolute deadline, and does not multiply database rows. Active sessions are capped at ten under a member lock on PostgreSQL. A deployment rejects legacy session-less JWTs and requires existing members to sign in again.
- Atomic database-backed quotas supplement the process limiter: account, source-IP and global auth budgets; member/read/write budgets; per-recipient/global mail budgets; bounded password-hash concurrency; cumulative minutes, event/skill/feedback storage ceilings. This uses the existing database, not newly purchased infrastructure. Gateway/DDoS limits still require cloud verification.
- Progress is self-reported. Competitive rankings/enrollment are disabled instead of treating client proof or arbitrary event IDs as verified achievement. Per-day activity/minute budgets limit growth; no claim of independently proving physical work is made.
- Private member records remain on-device after logout but the application locks private routes. A different account cannot silently inherit or delete those records: the original owner must first sign in and explicitly clear local data in Settings. Auth/session writes are serialized, asynchronous operations have generation checks, and new queued sync items carry owner IDs.
- Export and deletion require a login within fifteen minutes. Larger archives are paginated with ownership filters. Older clients receive an explicit upgrade error for an archive that would otherwise be truncated; the new client fetches all pages or reports failure. Export no longer silently omits cloud records when an API check fails.
- Production schema/interactive docs are disabled; SMTP requires TLS and certificate validation; SQL exception parameters are hidden; mail errors omit raw provider exceptions; request logging is configured. Recovery/verification pages clear consumed query tokens, receive no-store/no-referrer headers, and web CSP connections are limited to the configured production API.
- CI now runs backend tests against isolated PostgreSQL as well as SQLite and audits Python requirements. Dependabot also covers Python. A PostgreSQL migration explicitly revokes PUBLIC/anon/authenticated grants and enables RLS on the thirteen named private RISE tables; it changes no customer records or unrelated tables. Production startup checks this table ACL/RLS state, and public configuration reports only its readiness boolean. Credentials, storage buckets, and backup contents are untouched.
- The owner-supplied public postal identity is configured in the ignored local environment and EAS production environment. The earlier permitted ACE homepage-link correction is included in this source candidate.

## Verification boundaries

Regression tests cover immediate token revocation, logout concurrent with refresh, missing JWT claims, absolute session lifetime, session caps, shared quota persistence/atomicity, cumulative minutes, paginated export isolation, and delayed client refresh after logout. Actual run results and deployment receipts must be recorded after completion.

The local browser test startup with a localhost API override was rejected by automatic approval review; no bypass was attempted. Browser/physical-device UI verification remains incomplete. PostgreSQL checks must pass in CI before deployment; local SQLite results alone do not verify PostgreSQL locks.

Still operationally unverified: live database grants/RLS/Data API/storage exposure, verified database TLS, cloud IAM/MFA, provider key scopes, gateway protection, alert delivery, backup restoration, native sandbox/backup/media behavior, and OTA publisher/account security. A new image/native advisory scan and dedicated full secret-scanner rollout remain follow-up controls. The local audit is not a certification and these items are not marked fixed.

## Release gates

Build 25 phone testing and its previous screenshot do not establish Build 26 QA. Build 26 still needs its own device/upgrade checks and app-in-use captures. Content-rights review and Apple's declaration remain separate unresolved release requirements. Do not submit the public App Store release merely because the native build uploads successfully.
