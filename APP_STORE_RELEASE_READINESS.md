# RISE App Store release readiness

Updated: 2026-11-18

## Current decision

RISE is **not ready for public App Store submission yet**. TestFlight build 22 is the latest uploaded binary, and build 23 is configured locally but has not been built or uploaded. TestFlight beta upload and public App Store submission use separate gates: TestFlight can proceed once the live API and TestFlight preflight are healthy; exact-build screenshots, device QA, and App Store Connect attestations are completed after the beta binary exists and before public review.

## Verified complete

- Production `/health` returns `ok` and the public API reports version `1.2.0`.
- Public API configuration reports API version `1.2.0`.
- Privacy Policy, Privacy Choices, and Support pages are live over HTTPS.
- Email/password accounts, verification and password-reset token flows, export, sign-out, and in-app account deletion are implemented.
- Verification tokens remain one-time and expire after 24 hours; password-reset tokens expire after 30 minutes.
- Proof photos and videos remain on device; selected account and progress metadata sync to the first-party API.
- The app contains persistent Tour, Plan, and Settings navigation for signed-in users.
- The required tour contains five concise steps.
- Day locking, proof state, reward idempotency, personalized quizzes, and project suggestions have automated logic coverage.
- The app has no purchases, subscriptions, advertising SDK, or third-party analytics SDK.
- App tracking is not used.
- Account deletion is available inside the app.
- Updated policy consent is required before a new or returning member can enter a plan; quick-start no longer bypasses age and Terms acknowledgment.
- Account export and deletion now include email-bound founding invitations, and local-only deletion signs an authenticated member out without misrepresenting server deletion.
- Public-release copy no longer presents the installed app as an unfinished beta, and invites share the public RISE page rather than a TestFlight link.
- The current dependency audit reports zero critical, high, or moderate findings.
- Expo Doctor passes all 21 checks, the iOS production bundle exports successfully, 48 app logic tests pass, and 38 backend tests pass.
- Recovery, verification, Privacy, Privacy Choices, Terms, and Safety screens honor the shared light/dark appearance and expose improved accessibility state.
- `app-store/` contains validated English metadata, conservative privacy/age-rating guidance, final review notes, and an exact-Build-23 screenshot plan.
- The fail-closed App Store submission gate validates metadata limits, manual Apple/QA attestations, reviewer contact, EAS build-number availability, screenshot formats/dimensions/transparency, and the required current iPhone screenshot size before public App Store review.

## Blocking before a new TestFlight binary

1. **Transactional email:** public API configuration currently reports `email_delivery_ready: false`. Supply a RISE-owned domain, verify it in Resend with SPF, DKIM, and DMARC, then set Render's `RISE_EMAIL_FROM` and `RISE_RESEND_API_KEY`. A personal Gmail address or `onboarding@resend.dev` is not a production sender.
2. Run `npm run testflight:preflight` until it passes. Do not bypass its email-delivery check.
3. Build and upload the beta candidate with `npm run testflight:build-upload -- --execute`; then complete the physical-iPhone QA checklist below on that exact binary.

## Blocking before public App Store review

### Founder/legal information

1. Set `EXPO_PUBLIC_OPERATOR_LEGAL_NAME`, `EXPO_PUBLIC_OPERATOR_MAILING_ADDRESS`, and `EXPO_PUBLIC_LAUNCH_JURISDICTION` to verified public facts in the EAS production environment. The in-app Privacy Policy, Terms, and Safety Disclosure now read these values and the App Store preflight rejects missing or placeholder values. Have qualified counsel review the final documents; this repository cannot provide a guarantee against legal claims.
2. Confirm the monitored support contact and a deletion-request contact/process.
3. Confirm the minimum audience age and complete the age-rating questionnaire truthfully. If RISE will knowingly serve children under 13, obtain a specific COPPA review before launch.

### App Store Connect metadata

The app remains `iOS 1.0 · Prepare for Submission`. The following gaps were directly observed in App Store Connect on November 4, 2026 and must be rechecked before submission:

- Subtitle is blank.
- Primary and secondary categories are blank.
- App Privacy questionnaire has not been completed.
- User Privacy Choices URL is blank; use `https://rise-daily-skill-missions.vercel.app/privacy-choices`.
- Accessibility questionnaire has not been completed. This is recommended even where not required.
- No App Review submission is present.

App Store Connect also showed an active EU Digital Services Act warning on November 17, 2026: an Admin or Account Holder must provide the developer's trader status before distributing this app or an update in the European Union.

Also complete or re-verify:

- Accurate description, keywords, copyright, territories, and age rating.
- Final iPhone screenshots captured from the exact submitted build (at least one required for each required display size).
- App Review contact first/last name, phone, and email.
- A non-expiring reviewer account plus concise login and feature-review instructions.
- Review notes explaining that proof media stays on device, accounts/progress metadata syncs, and the app is a free educational service with no purchases.
- Select the final processed build only after internal upgrade/data-retention testing.

## Required physical-device verification

- Install the candidate over the current TestFlight build and verify accounts, plan, coins, proof state, and mission progress are retained.
- Test signup, verification, resend limits, sign-in, sign-out, password reset, token expiry, and invalid/used links with at least two non-owner email providers.
- Complete onboarding, the five-step tour, a full Day 1 mission, proof/reflection, quiz, reward, and next-day lock/unlock cycle.
- Deny and allow camera/photo/video/microphone and notification permissions, then change them later in iOS Settings.
- Test notification timing, multiple daily check-ins, time-zone changes, app restart, offline launch, slow/free-tier API wake-up, and recovery after network loss.
- Attach/replace photo and video proof, reopen the mission, and verify submitted state never asks for duplicate proof or awards duplicate coins.
- Test keyboard reachability, minimum touch targets, VoiceOver labels/order, Dynamic Type, Reduce Motion, light/dark appearance, and contrast.
- Test export and permanent account deletion, then verify the deleted account cannot sign in and onboarding starts cleanly.
- Check every external guide, video, Privacy, Privacy Choices, Terms, Support, and feedback link.

## App Store privacy declaration baseline

Reconfirm this against the final production build before answering Apple's questionnaire:

- Price: Free.
- In-app purchases/subscriptions: None.
- Accounts: Email/password.
- Tracking/advertising: None.
- Third-party analytics SDK: None.
- First-party data: account identifiers and selected plan/progress/mission/quiz/focused-time metadata; optional operator analytics only when opted in.
- Proof-file cloud upload: None.
- Public user-generated content: None.

## Release commands

Use the TestFlight commands to create and upload a beta binary. Run the App Store gates after the exact build exists and the device QA, screenshots, legal facts, and App Store Connect questionnaires have been completed:

```text
npm run check
npm run test:logic
npm run testflight:preflight
npm run security:audit
npx expo-doctor
npm run testflight:build-upload
npm run testflight:build-upload -- --execute
```

After the beta is processed and device QA/screenshots are complete, run `npm run appstore:preflight` and `npm run appstore:submission:preflight`. Those App Store gates are intentionally separate from TestFlight upload because exact-build screenshots and physical-device attestations cannot exist before the build. TestFlight upload does not submit the app for public App Store review; do not submit the public version merely because the binary processed successfully.
