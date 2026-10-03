# Build 6 readiness

Build 6 focuses on trustworthy beta feedback and release reliability.

## Included

- Signed-in feedback is committed to PostgreSQL before email delivery is attempted.
- A privacy-minimized copy is emailed to `rise.app13@gmail.com` through the existing transactional-email configuration.
- Temporary email failure does not discard the member's feedback.
- Feedback remains included in account export and removed with account deletion.
- The in-app disclosure and privacy notice explain storage and email delivery before submission.
- Automated tests cover successful notification and mail-provider failure.
- The iOS build number is pinned to `6` and TestFlight preflight rejects reused build numbers.
- Expo's compatibility checker passes. The dependency audit contains a time-limited, named exception for current Expo SDK 57/React Native transitive advisories that have no compatible in-family upgrade; unknown or critical advisories still fail the build, and the exception expires November 15, 2026.

## Release gate

Do not replace the public build until build 6 has been installed over the current TestFlight build on a real iPhone and these checks pass:

1. Existing account, plan, mission progress, rewards, and local proof references remain present.
2. Login, registration, password reset, and email verification work.
3. A signed-in feedback submission appears in the account export and arrives at the support inbox.
4. A failed or offline request leaves a usable local feedback copy.
5. Mission completion, proof attachment, quiz gating, notifications, account export, and deletion work.

No software release can be guaranteed perfect or guaranteed approval. This checklist records the remaining device-level evidence required before external distribution.
