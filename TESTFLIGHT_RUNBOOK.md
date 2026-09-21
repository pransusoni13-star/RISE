# RISE TestFlight launch runbook

The codebase is a beta candidate, **not an uploaded or approved build**. The steps below must be completed with the real Apple Developer and hosting accounts. Never put a database password, JWT secret, or admin key in an `EXPO_PUBLIC_` variable.

## 1. Production service

Deploy `backend/` behind a stable HTTPS address with managed PostgreSQL and backups. Set `RISE_ENV=production`, `RISE_DATABASE_URL`, a unique `RISE_JWT_SECRET`, the exact HTTPS website origin in `RISE_ALLOWED_ORIGINS`, a separate random `RISE_ADMIN_API_KEY`, and `RISE_FOUNDING_REDEMPTION_ENABLED=false`. Confirm `/health` works from cellular data, then test account creation, login, progress, export, and deletion. The app should not depend on the laptop's `192.168.x.x` address.

Create the EAS production environment variable `EXPO_PUBLIC_API_URL` with the deployed HTTPS origin. It is a public address, not a secret. See [Expo EAS environment variables](https://docs.expo.dev/eas/environment-variables/). Verify the production build uses it; the local ignored `.env` is for Expo Go only.

## 2. Apple ownership and disclosures

Enroll in Apple Developer. Add your real `ios.bundleIdentifier` to `app.json` (it must match the Apple app record). Publish a lawyer-reviewed Privacy Policy and a working support page with your real operator and contact information. Enter both HTTPS URLs in App Store Connect. Complete the app privacy questionnaire accurately for email, account data, and synced progress. Prepare an App Review test account that will not expire and provide its credentials privately in App Store Connect review information. Do not put credentials in Git.

Keep payments and subscriptions disabled in this beta. The founding-member entitlement is recorded in the backend but redemption is **off** for TestFlight. Do not promise billing or claim that Apple has approved any future subscription offer.

## 3. Physical iPhone test

On a real iPhone away from the laptop's Wi-Fi, finish both guest and signed-in onboarding, choose goals, open resources, complete a mission, attach photo and video proof, submit a reflection, take a quiz, view progress, opt in and out of comparison, export data, sign out, and delete a test account. Test denied permissions, keyboard visibility, offline/reconnect, app restart, and the smallest supported iPhone. Fix every crash or blocked path before inviting testers.

## 4. Preflight and build

Set `RISE_PRIVACY_POLICY_URL` and `RISE_SUPPORT_URL` in the operator terminal along with the production `EXPO_PUBLIC_API_URL`, then run `npm run testflight:preflight`. It intentionally fails until the bundle ID, HTTPS API, and public URLs are real. Run `npm run check`, `backend/.venv/Scripts/python -m pytest -q` on Windows, and `npx expo export --platform web`.

After the preflight passes, create and upload the signed iOS build using the `testflight` EAS profile (`eas build --platform ios --profile testflight`, then `eas submit --platform ios --profile production`). These commands require your Expo and Apple accounts and may prompt for credentials; do not run them with placeholder values. Follow [Expo's iOS submission guide](https://docs.expo.dev/submit/ios/).

In App Store Connect, complete TestFlight beta description, feedback email, review contact, encryption/export compliance, and “What to Test.” Put the working demo account and any special setup in Beta App Review Information. The first external build goes through Apple's TestFlight review. Only share the invite link after approval. [Apple TestFlight overview](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/).

## 5. Public App Store launch, later

Do not enable founding-member redemption during TestFlight. When the public App Store version is actually live, privately deliver the 60 email-bound codes, set `RISE_FOUNDING_REDEMPTION_ENABLED=true` on the production API, and restart it. Test a claim against a beta-created account using its waitlist email. The free year begins at claim time. Billing remains unimplemented; decide and implement App Store subscription handling separately before charging anyone.
