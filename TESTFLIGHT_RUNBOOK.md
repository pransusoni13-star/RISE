# RISE TestFlight launch runbook

The codebase is a beta candidate, **not an uploaded or approved build**. The steps below must be completed with the real Apple Developer and hosting accounts. Never put a database password, JWT secret, or admin key in an `EXPO_PUBLIC_` variable.

**When to start:** Upload an internal TestFlight build as soon as sections 1–3 work on a physical iPhone. Start external beta review only after the production service and reviewer account are stable. Share a public/Instagram link only after Apple approves the first external build and a small test group completes the core journey without blocking bugs. Do not promise a date based on an upload alone; Apple publishes no guaranteed beta-review turnaround. See `REVIEW_AND_SECURITY_AUDIT.md` for the screenshot-by-screenshot audit.

## Owner setup: the order to follow

1. Decide who owns RISE. If you have no legally registered company, enroll as an **individual** using an Apple Account you personally control. Apple will show your legal name as the seller. A RISE-branded email is useful for tester support but does **not** make an individual account a company account. An organization enrollment needs a legal entity, D-U-N-S number, domain-matched work email, and functional public website. Apple requires two-factor authentication and the legal age of majority for enrollment. Keep the Account Holder Apple Account long-term; do not share its password or verification codes.
2. Complete [Apple Developer enrollment](https://developer.apple.com/help/account/membership/program-enrollment) and the annual fee. Confirm you can sign in to [App Store Connect](https://appstoreconnect.apple.com/) and accept the latest agreement. Do not create an unrelated second paid membership just for a branded email.
3. Pick a unique reverse-DNS bundle ID you own (for example, `com.yourdomain.rise` **only if you own that domain**) and register it in Apple Developer. Add the exact same value to `app.json` under `expo.ios.bundleIdentifier`. This identifier is long-lived; do not invent or change it casually after creating the App Store Connect app.
4. In App Store Connect, create a new iOS app record named RISE with that bundle ID and an internal SKU. Add a real feedback email, support URL, privacy URL, App Privacy answers, age-rating answers, and TestFlight test information. Use the real app and operator details, not placeholders. Prepare a durable reviewer login and keep its password only in App Store Connect's private review fields.
5. Decide whether the Expo project belongs to your personal Expo account or your RISE team. Sign in to that account with EAS CLI, then run `eas init` in this repository. Confirm `app.json` now contains the correct `extra.eas.projectId` and, when relevant, `owner`. This is an account-ownership decision; do not link the project to a team by guessing.
6. Finish the production API and public web pages in sections 1–2. Set `EXPO_PUBLIC_API_URL` in the EAS **production** environment to the real HTTPS API origin. Put the privacy/support URLs in your local operator environment for the preflight. Never put the JWT secret, database URL, or admin key in an `EXPO_PUBLIC_` variable.
7. Run the checks and physical iPhone journey in sections 3–4. Test daily notifications on the signed build, including permission denial, changing the time, tapping into Today, app restart, and turning reminders off. These are local, opt-in reminders—not a guaranteed or server-sent push system.
8. Build with `eas build --platform ios --profile testflight`, then upload with `eas submit --platform ios --profile production`. Follow the prompts to select your Apple team, app, and build. Inspect the processed build in App Store Connect → RISE → TestFlight. Do not post a link yet.
9. Invite a small internal team first. Fix blocking bugs and upload another build if needed. Then create an external tester group, add the build, submit the required Beta App Review information, and wait for Apple's approval. Only after approval, enable a capped public invitation link and put it in your Instagram bio. TestFlight testers install Apple's free TestFlight app, then accept the link and install RISE. Each build expires after 90 days.

The [Expo TestFlight guide](https://docs.expo.dev/submit/testflight/) explains build/submit options; the explicit commands above match this repository's EAS profiles. TestFlight is not the public App Store release, and approval is never guaranteed.

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
