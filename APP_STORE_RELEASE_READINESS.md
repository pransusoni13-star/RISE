# RISE App Store release readiness

Updated: 2026-09-21

## Implemented in the application

- Free beta with email/password accounts, optional founding-member codes, and on-device proof files.
- No purchase, subscription, billing, or automatic renewal flow.
- Age 13+ confirmation and educational/safety acknowledgement.
- Camera, photo, video, and microphone purpose strings.
- Proof limitations and third-party resource disclosures.
- In-app privacy, safety, terms, help, and feedback routes.
- Permanent deletion of all keys owned by RISE from Settings and Privacy.
- User-controlled export of local and synced account records from Settings.
- Native protected storage for optional faith/trusted-source preferences; session-only handling on web.
- No analytics SDK, advertising SDK, marketing email, payment flow, or RISE proof-file upload. Optional first-party operator analytics is off by default. Opting out removes timing events and excludes core progress from operator reports, without deleting the member's own progress.
- FastAPI account service with Argon2 password hashes, short-lived JWT access tokens, rotated refresh tokens, server authorization, deletion, and progress export.
- Private operator usage report and opt-in, identity-free community comparison.
- Founding-member redemption disabled by default until the public App Store launch.
- Honest rewards with no cash value.
- Quiz gate, progress, proof reflection, and mission review behavior.
- Static web export and mobile/desktop responsive public landing experience.
- EAS preview, TestFlight, and production build profiles.
- Expo lint configuration plus a single `npm run check` release-quality command.
- Proof file type, size, and video-duration restrictions.
- Static-host and Vercel security-header policies plus documented security status.

## Owner information still required

These values cannot be invented or safely selected by code:

1. Apple Developer individual or organization enrollment.
2. A unique iOS bundle identifier owned by the developer.
3. The verified legal operator name and business address where required.
4. A monitored support email address.
5. A production HTTPS domain.
6. Public Privacy Policy, Terms, Support, and deletion-instructions URLs on that domain.
7. Final App Store name, subtitle, description, keywords, category, age-rating answers, copyright, and territories.
8. App Store screenshots captured from the final iPhone build.
9. App Review contact details and review notes.
10. Production PostgreSQL and HTTPS API hosting, a production JWT secret, backups, migrations, and shared rate limiting.
11. A non-expiring App Review account plus review instructions for account-gated features.
12. A complete real-iPhone QA pass and the launch steps in `TESTFLIGHT_RUNBOOK.md`.
13. Fix or formally assess the current moderate dependency advisories; obtain a focused authorization and security review.

## Required physical-device verification

- Complete onboarding and a full mission cycle on the oldest supported iPhone size.
- Deny, allow, and later change photo/camera/microphone permissions.
- Attach a photo and video, replace each, submit proof, and retry rejected proof.
- Test the keyboard on every text field and verify the main action remains reachable.
- Test offline launch, app restart, low-storage behavior, and loss of a referenced local file.
- Complete and fail the cycle quiz, retry it, and confirm rewards are issued only once.
- Delete all RISE data and verify onboarding starts cleanly.
- Test VoiceOver, Dynamic Type, Reduce Motion, dark appearance, and 200% text where available.
- Check every external guide and video link.

## App Store Connect declarations for this local-first version

- Price: Free.
- In-app purchases: None.
- Accounts: Email/password account used for skill and progress synchronization.
- App tracking: No.
- Advertising: None.
- Analytics SDK: None.
- First-party account progress metrics: Yes, for the user's own synced experience. Optional operator analytics includes mission activity and signup/app-use timing when opted in. Complete Apple's privacy questionnaire accordingly.
- RISE cloud upload: None.
- User-generated public content: None.

Re-evaluate every declaration before submission. Adding authentication, analytics, crash reporting, cloud proof storage, community sharing, or payments changes the privacy and review answers.

## Recommended App Review note

RISE is a free beta educational planning application and does not offer purchases. Users create an account, choose career and life directions, receive a personalized mission plan, attach on-device proof, write reflections, and complete cycle quizzes. The service syncs account, selected-skill, mission, quiz, and focused-time metadata; attached proof photos and videos remain on the device. Settings provides data export, sign-out, local deletion, and in-app account deletion. App Review credentials and exact test instructions will be supplied in App Store Connect.
