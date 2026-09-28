# RISE private-beta deployment handoff

Status: prepared locally, not deployed. Hosting account and budget are not yet chosen.
Do not collect real beta-user data until the release gates below are addressed.

## Hosting setup

1. With the adult responsible for the service, choose a Docker-capable host and managed PostgreSQL. Confirm monthly cost, region, backup retention, and who owns the accounts.
2. Build using `backend` as the Docker build context and `Dockerfile` inside that directory. The image runs as a non-root user and accepts the host's `PORT` environment variable (default 8000).
3. Set secrets in the host's secret manager, not Git or Expo public variables:
   - `RISE_ENV=production`
   - `RISE_DATABASE_URL`: provider PostgreSQL connection string using `postgresql+psycopg://`, with TLS configured per provider instructions.
   - `RISE_JWT_SECRET`: independently generated random secret, at least 32 characters.
   - `RISE_ADMIN_API_KEY`: a different random secret, at least 32 characters.
   - `RISE_ALLOWED_ORIGINS`: exact HTTPS web origins, comma separated, without paths or trailing slashes.
   - `RISE_PUBLIC_APP_URL`: the public HTTPS web app origin used for reset links.
   - `RISE_SMTP_HOST`, `RISE_SMTP_PORT`, `RISE_SMTP_USERNAME`, `RISE_SMTP_PASSWORD`, `RISE_SMTP_FROM_EMAIL`: transactional email provider settings. Test delivery and spam placement before invitations.
   - `RISE_FOUNDING_REDEMPTION_ENABLED=false`: keep disabled until the actual App Store launch.
4. Expose only through the provider's HTTPS endpoint. Configure `/health` as a readiness check. It checks the database too; expect HTTP 200 with `{"status":"ok"}`.
5. Configure trusted proxy addresses explicitly through `FORWARDED_ALLOW_IPS` according to the provider. Do not trust arbitrary internet-supplied forwarding headers. Enforce a request-body limit at the gateway, including chunked requests.
6. Start with one instance and one worker: the current rate limiter is process-local. Add a shared rate-limit store before scaling horizontally. Apply gateway abuse controls too.
7. Set the app's `EXPO_PUBLIC_API_URL` to the deployed HTTPS API URL and rebuild. This is a public URL, never a database password or admin key.

## Gates before inviting real users

- Add reviewed schema migrations; current `create_all` only initializes missing tables and cannot safely evolve an existing schema.
- Enable managed backups and successfully restore a test backup into a separate database.
- Password recovery and email verification are implemented but must be tested end-to-end with the chosen email provider. Keep invitations controlled until delivery, spam placement, expired links, and resend behavior pass staging tests.
- Complete operator identity, audience/country decisions, retention/backup-deletion rules, privacy policy and terms review. Publish accessible HTTPS privacy/support pages. Public contact: rise.app13@gmail.com.
- Resolve or formally assess outstanding dependency advisories; never use a forced Expo downgrade as an audit fix.
- Test two separate accounts for isolation, logout, deletion, export, progress sync and opt-in ranking. Use synthetic data before production data.
- Test the signed build on an iPhone: keyboard, photos/videos, denied permissions, reminders, offline retries, and account deletion. Web tests do not verify these.
- Confirm founder redemption remains disabled and no billing starts during the free beta.

## Rollout and rollback

Keep the previous image available, deploy first to staging, test `/health` and the core journey, then invite a small private group. Monitor errors without logging tokens, passwords, reflections or proof content. If a deployment fails, restore the previous compatible image; database changes require their own reviewed rollback or restore plan. Do not promise zero downtime, guaranteed notifications, or independently verified proof.
