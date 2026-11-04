# RISE App Store release readiness

Updated: 2026-11-04

## Current decision

RISE is **not ready for public App Store submission yet**. TestFlight build 17 remains the latest binary and receives compatible runtime `1.0.0` updates. The repository is configured for iOS build 19, but a new binary should not be uploaded until the blocking items below are resolved and the preflight passes.

## Verified complete

- Production backend commit `57c40b0` is deployed and `/health` returns `ok`.
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
- The project currently has no critical dependency-audit findings.

## Blocking before a new TestFlight binary

1. **Transactional email:** public API configuration currently reports `email_delivery_ready: false`. Supply a RISE-owned domain, verify it in Resend with SPF, DKIM, and DMARC, then set Render's `RISE_EMAIL_FROM` (or the supported sender variable) and `RISE_RESEND_API_KEY`. A personal Gmail address or `onboarding@resend.dev` is not a production sender.
2. Run `npm run testflight:preflight` until it passes. Do not bypass its email-delivery check.
3. Complete the physical-iPhone QA checklist below on the exact release candidate.

## Blocking before public App Store review

### Founder/legal information

1. Replace the placeholders in the in-app Privacy Policy and Terms with the verified operator legal name, mailing address, and launch-jurisdiction wording. Have qualified counsel review the final documents; this repository cannot provide a guarantee against legal claims.
2. Confirm the monitored support contact and a deletion-request contact/process.
3. Confirm the minimum audience age and complete the age-rating questionnaire truthfully. If RISE will knowingly serve children under 13, obtain a specific COPPA review before launch.

### App Store Connect metadata

The following gaps were directly observed in App Store Connect on November 4, 2026:

- Subtitle is blank.
- Primary and secondary categories are blank.
- App Privacy questionnaire has not been completed.
- User Privacy Choices URL is blank; use `https://rise-daily-skill-missions.vercel.app/privacy-choices`.
- Accessibility questionnaire has not been completed. This is recommended even where not required.
- No App Review submission is present.

Also complete or re-verify:

- Accurate description, keywords, copyright, territories, and age rating.
- Final iPhone screenshots captured from the exact submitted build (at least one required for each required display size).
- App Review contact first/last name, phone, and email.
- A non-expiring reviewer account plus concise login and feature-review instructions.
- Review notes explaining that proof media stays on device, accounts/progress metadata syncs, and the app is a free educational beta with no purchases.
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

Only after the blockers are cleared:

```text
npm run check
npm run test:logic
npm run testflight:preflight
npx expo-doctor
npx eas-cli build --profile testflight --platform ios --auto-submit --non-interactive
```

Public App Store submission is a separate decision after TestFlight processing and physical-device QA. Do not submit the public version merely because the binary processed successfully.
