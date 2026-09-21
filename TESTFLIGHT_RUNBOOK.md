# RISE TestFlight launch runbook

The codebase is a beta candidate, **not an uploaded or approved build**. The steps below must be completed with the real Apple Developer and hosting accounts. Never put a database password, JWT secret, or admin key in an `EXPO_PUBLIC_` variable.

**When to start:** Upload an internal TestFlight build as soon as sections 1–3 work on a physical iPhone. Start external beta review only after the production service and reviewer account are stable. Share a public/Instagram link only after Apple approves the first external build and a small test group completes the core journey without blocking bugs. Do not promise a date based on an upload alone; Apple publishes no guaranteed beta-review turnaround. See `REVIEW_AND_SECURITY_AUDIT.md` for the screenshot-by-screenshot audit.

## 1. Production service

Deploy `backend/` behind a stable HTTPS address with managed PostgreSQL and backups. Set `RISE_ENV=production`, `RISE_DATABASE_URL`, a unique `RISE_JWT_SECRET`, the exact HTTPS website origin in `RISE_ALLOWED_ORIGINS`, a separate random `RISE_ADMIN_API_KEY`, and `RISE_FOUNDING_REDEMPTION_ENABLED=false`. Confirm `/health` works from cellular data, then test account creation, login, progress, export, and deletion. The app should not depend on the laptop's `192.168.x.x` address.

Use an API gateway or reverse proxy for shared IP/user rate limits, a real maximum body size including chunked requests, TLS, and security-event logging that excludes passwords and tokens. The app's in-process limiter is only a beta backstop. Add email verification and a safe password-reset flow before open public enrollment.

Create the EAS production environment variable `EXPO_PUBLIC_API_URL` with the deployed HTTPS origin. It is a public address, not a secret. See [Expo EAS environment variables](https://docs.expo.dev/eas/environment-variables/). Verify the production build uses it; the local ignored `.env` is for Expo Go only.

## 2. Apple ownership and disclosures

Enroll in Apple Developer. Add your real `ios.bundleIdentifier` to `app.json` (it must match the Apple app record). Publish a lawyer-reviewed Privacy Policy and a working support page with your real operator and contact information. Enter both HTTPS URLs in App Store Connect. Complete the app privacy questionnaire accurately for email, account data, and synced progress. Prepare an App Review test account that will not expire and provide its credentials privately in App Store Connect review information. Do not put credentials in Git.

Disclose first-party progress metrics and optional usage timing accurately. Usage timing is off by default, opt-in at signup or later in Settings, and past timing events are removed on opt-out. Keep third-party login and digital purchases absent from this free beta; do not claim Apple sign-in, Stripe, or purchase restoration are supported.

Keep payments and subscriptions disabled in this beta. The founding-member entitlement is recorded in the backend but redemption is **off** for TestFlight. Do not promise billing or claim that Apple has approved any future subscription offer.

## 3. Physical iPhone test

On a real iPhone away from the laptop's Wi-Fi, finish both guest and signed-in onboarding, choose goals, open resources, complete a mission, attach photo and video proof, submit a reflection, take a quiz, view progress, opt in and out of comparison, export data, sign out, and delete a test account. Test denied permissions, keyboard visibility, offline/reconnect, app restart, and the smallest supported iPhone. Fix every crash or blocked path before inviting testers.

## 4. Preflight and build

Set `RISE_PRIVACY_POLICY_URL` and `RISE_SUPPORT_URL` in the operator terminal along with the production `EXPO_PUBLIC_API_URL`, then run `npm run testflight:preflight`. It intentionally fails until the bundle ID, HTTPS API, and public URLs are real. Run `npm run check`, `backend/.venv/Scripts/python -m pytest -q` on Windows, and `npx expo export --platform web`.

After the preflight passes, create and upload the signed iOS build using the `testflight` EAS profile (`eas build --platform ios --profile testflight`, then `eas submit --platform ios --profile production`). These commands require your Expo and Apple accounts and may prompt for credentials; do not run them with placeholder values. Follow [Expo's iOS submission guide](https://docs.expo.dev/submit/ios/).

In App Store Connect, complete TestFlight beta description, feedback email, review contact, encryption/export compliance, and “What to Test.” Put the working demo account and any special setup in Beta App Review Information. The first external build goes through Apple's TestFlight review. Only share the invite link after approval. [Apple TestFlight overview](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/).

For the first public link, set a deliberately small tester cap, watch TestFlight crashes and feedback, and increase the cap only after fixes are verified. Apple allows up to 10,000 external testers, but that is a platform ceiling, not a safe starting target. An invitation link can be posted in an Instagram bio only after external approval and while the build is available; TestFlight builds expire after 90 days.

## 5. Public App Store launch, later

Do not enable founding-member redemption during TestFlight. When the public App Store version is actually live, privately deliver the 60 email-bound codes, set `RISE_FOUNDING_REDEMPTION_ENABLED=true` on the production API, and restart it. Test a claim against a beta-created account using its waitlist email. The free year begins at claim time. Billing remains unimplemented; decide and implement App Store subscription handling separately before charging anyone.
