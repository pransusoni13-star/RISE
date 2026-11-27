# RISE Python backend

FastAPI service for RISE accounts, founding-member entitlements, skill selection, and measurable progress.

## Local setup

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements-dev.txt
Copy-Item .env.example .env
.\.venv\Scripts\python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Generate a strong production secret with `py -c "import secrets; print(secrets.token_hex(32))"`. Never put it in an `EXPO_PUBLIC_` variable.

## Founding 60 workflow

Prepare a private CSV with one column named `email`, then run:

```powershell
.\.venv\Scripts\python scripts\import_founding_members.py waitlist.csv founding-codes.csv
```

The command refuses to create more than 60 total invitations. Each code is random, stored only as a SHA-256 hash, bound to one normalized email, and claimable once. Deliver each code privately to its matching waitlist member. Protect and delete the generated output CSV after delivery.

## Production requirements

- Use managed PostgreSQL by setting `RISE_DATABASE_URL`.
- Set `RISE_ENV=production` and a unique `RISE_JWT_SECRET` of at least 32 characters.
- Set `RISE_ALLOWED_ORIGINS` to the exact HTTPS website origin.
- Run behind an HTTPS reverse proxy. Shared PostgreSQL auth/read/write/mail budgets supplement the process-local limiter across workers; review gateway controls separately.
- Startup applies Alembic migrations and verifies private-table ACL/RLS protections. Require database TLS and narrow network access. Configure and test backups; the current Supabase Free plan does not include scheduled project backups. See [production operations](OPERATIONS.md).
- Set the mobile build variable `EXPO_PUBLIC_API_URL` to the production HTTPS API URL.

The current entitlement records one free year from code activation. Billing is not implemented; any future billing service must honor `founding_expires_at` and must not charge founding members before that date.

## Private improvement analytics and optional comparison

Set a separate, random `RISE_ADMIN_API_KEY` (at least 32 characters). The private `/admin/analytics` endpoint returns aggregate member activity plus up to 100 ID-only member summaries. It includes signups, active members, completed missions, focused minutes, estimated signup time, and time from account creation to the first mission. Signup timing is client-reported, so treat it as directional rather than audited. Proof files and reflection text are not included. Never put the admin key in an `EXPO_PUBLIC_` variable or the app bundle.

Set `RISE_API_URL` and `RISE_ADMIN_API_KEY` in your operator terminal, then run `py scripts/analytics_report.py`. For a local-only check, `RISE_API_URL` can be `http://127.0.0.1:8000`; deployed use requires HTTPS.

Progress is self-reported. Competitive rankings and new leaderboard enrollment are disabled; previously enrolled members can remove their consent. Do not represent client-reported mission counts or minutes as independently verified activity.

## Founding-member launch switch

Keep `RISE_FOUNDING_REDEMPTION_ENABLED=false` through TestFlight. After the public App Store release is live and the waitlist invitations have been delivered, set it to `true` on the server and restart the API. The app reads `/config/public` and reveals the claim UI at that point. A person who created an earlier account can claim later with the email-bound code; the free year starts on successful claim, not during TestFlight. Do not enable this switch merely because the TestFlight build passed review.
