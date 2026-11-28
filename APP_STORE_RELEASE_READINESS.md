# RISE App Store release readiness

Updated: 2026-11-27

## Current result — Build 29

Version 1.0.0 (29) built, uploaded and processed successfully. Apple's API reports VALID and IN_BETA_TESTING internally, with external state READY_FOR_BETA_SUBMISSION. It includes the Build 28 product improvements plus protected-preference restoration/migration fixes, shared atomic XP/coin updates, recovery for unreadable storage, background delivery after durable sync queueing and correct ten-/twenty-minute plans. All 96 app tests, final TypeScript/lint/dependency checks and PR/main CI verification and security jobs passed. Actual IPA metadata and pattern-scan contexts were inspected; see [Build 29 changes and receipts](RELIABILITY_BUILD_29.md).

Build 27 remains the last verified public beta and selected App Store version. External release of 29, revised listing/reviewer text and selecting 29 await browser control returning after Apple verification. Public App Review is not submitted. Exact-build phone QA/screenshots and reviewer-login validation remain; owner-reported rights, email and MFA/backup completion are preserved.

## Historical result — Build 28

Build 1.0.0 (28) is built, uploaded and processed as VALID in Apple's API, with internal state IN_BETA_TESTING. It delivers written completion with optional media, practical feedback adaptation, saved-result history, Today improvements and storage-failure protection. All 86 app tests passed; PR and main CI passed app/backend verification, secret scanning and container scanning. See [Build 28 product changes and receipts](PRODUCT_QUALITY_BUILD_28.md).

Build 28's external state is READY_FOR_BETA_SUBMISSION. Build 27 is still the last verified public beta and selected App Store candidate. External distribution of 28, its App Store selection and saving revised listing/reviewer text await browser control returning from the pending Apple address-verification handoff. Public App Review has not been submitted. Exact-build 28 phone QA, screenshots and reviewer-login validation remain. Content rights, two-provider email testing and operator MFA/backup work were subsequently reported complete by the owner; these are attestations rather than independent retests. No supplied contact details need to be requested again.

## Historical result — Build 27

Version 1.0.0 (27) finished and uploaded, is **Testing** in RISE Public Beta, and is selected/saved as the App Store candidate. Public App Review remains **Prepare for Submission**. The additional offline-sync, goal-matching, proof-file and privacy corrections are shipped in 27. The updated website and patched backend are live. Supabase SSL enforcement and a narrow direct-database network allowlist are enabled; API database-backed health and catalog reads pass after the changes. Canada-only App Store availability is saved; Mac/Vision Pro distribution is disabled. The Free Apps Agreement is Active.

See [the seven-area verification report](RELEASE_VERIFICATION_2026-11-27.md) for receipts and boundaries and [remaining owner actions](app-store/OWNER_RELEASE_ACTIONS.md) for the consolidated handoff. Actual Build 27 phone QA/screenshots, reviewer-login validation, rights confirmation, two-provider delivery, Vercel MFA, and backup/restore/alert arrangements remain. Apple's business postal correction is prepared but unsaved after its supplied 2FA code was rejected. No manual check or legal declaration was fabricated.

## Build 26 release receipt — supersedes historical status below

Build 26 (version 1.0.0) finished and uploaded successfully. Apple received it November 27 at 4:32 PM Toronto. Added RISE Internal Beta and RISE Public Beta, saved testing instructions, submitted the external beta flow, and verified Build 1.0.0 (26) has status **Testing** in the public group. Tester link: https://testflight.apple.com/join/gwYy6GNr . Build 26 is selected and saved for the App Store version, which remains **Prepare for Submission**; public App Review was not submitted.

- EAS build: https://expo.dev/accounts/rise.0/projects/RISE/builds/b15ec361-f06e-40a3-a05c-feeda79a8138 . Submission: 858fe799-fe3e-4c66-a6ae-992dda006d90. Apple build: 7c397e32-5f3e-40e4-a151-4f9db83fa930.
- Security changes merged in PR https://github.com/pransusoni13-star/RISE/pull/29 at d637aa760910f53247fd00ac800682b4d2c4004c. CI passed 71 app logic tests, 54 PostgreSQL backend tests, SQLite 53 tests with one PostgreSQL-specific skip, typecheck/lint, dependency audits, and Expo checks. iOS Hermes export and Expo Doctor passed. See SECURITY_REMEDIATION.md for changes and limits.
- Render deployment dep-dc4vb4tg1s2s73808jp0 is Live on this merge commit. Health/configuration returned 200; private-table ACL/RLS readiness and email readiness were true; production schema documentation returned 404.
- The postal identity is configured locally and in EAS production and is included in Build 26. Vercel's live privacy page still shows the operator fallback: connector team access returned 403, the authorization helper returned 404, and the browser required login. No website environment update was completed. Website identity and alignment of policy copy with disabled rankings remain outstanding.
- Build 26 device QA remains unverified. The Build 24 welcome screenshot is still the only supplied capture; capture Today, Plan, and Progress from Build 26. Existing owner-reported Build 25 phone testing is historical and does not establish Build 26 upgrade retention, email, permissions/offline, or accessibility testing. All Build 26 manual QA flags remain false.
- Still unresolved for public release: the operator's factual content-rights declaration; validated review-account access; territory/DSA and agreement checks; accessibility declarations; exact-build phone checks and app-in-use screenshots; remaining cloud operational controls described in SECURITY_REMEDIATION.md. No legal declaration or unperformed QA was marked complete.
- Automatic approval review blocked the local web UI test launch with a localhost API override. No bypass was attempted; this does not affect the completed Apple upload.

## Historical Build 25 record

November 27 follow-up: owner supplied a complete Canadian postal address, stored only in ignored release configuration, and reported completing the requested Build 25 phone checks. Recorded the physical-iPhone check as owner-reported; separate upgrade, two-provider email, and accessibility checks remain unverified. Owner identified ChatGPT as the artwork source; see `app-store/CONTENT_RIGHTS_REVIEW.md`. Adjusted ACE links to the homepage expressly covered by its published linking permission. These source/configuration changes postdate Build 25 and are not yet delivered to that installed binary. Historical missing-address entries below are superseded by this update.

## Historical decision before Build 26

Build 25 is **Testing in the RISE Public Beta TestFlight group**, verified in App Store Connect after browser access was restored. Its binary state is Validated. It is also selected for the public App Store version, which remains Prepare for Submission. Apple's latest Add for Review validation reports only missing Content Rights Information. Final Build 25 screenshots, device QA, public postal identity, and confirmation of rights remain unresolved. Historical browser-denial entries below are superseded by this verification.

## App Store Connect browser verification

- Added Build 25 to RISE Internal Beta (2 testers) and RISE Public Beta (27 testers), entered testing notes, and submitted through the external beta review flow. The public group subsequently showed Build 1.0.0 (25), status Testing. Existing public link: https://testflight.apple.com/join/gwYy6GNr.
- Replaced Build 23 with Build 25 on the App Store release version. Saved Aayush Soni's copyright and review contact details, corrected the mandatory-proof review instructions, and saved the current repository description. Disabled Game Center, which the app does not implement.
- Uploaded the owner-authorized, unmodified IMG_3166.jpeg into the required iPhone Dynamic Island medium screenshot slot. Apple shows 1 of 10 App Screenshots and no longer reports a missing screenshot. This is still the owner's Build 24 welcome capture; it is not evidence of Build 25 QA or an adequate app-in-use screenshot set.
- Verified Education / Productivity categories and the current subtitle. Existing age rating is 13+ in most regions, with regional 12+ ratings. Privacy labels were already published, with Name, Email Address, Customer Support, Other User Content, User ID, and Product Interaction; privacy-policy and privacy-choices URLs are set.
- Availability is currently all 175 countries/regions, including Canada. This was observed, not changed or independently cleared for every jurisdiction. Mac and Vision Pro availability are enabled in the existing record; compatibility testing was not attested.
- Content Rights asks whether the app contains, shows, or accesses third-party content and, if yes, whether the necessary rights are held. RISE links to third-party learning resources. Asked the owner to confirm the factual rights basis; neither answer was fabricated. The dialog was cancelled without saving a declaration.
- Existing review credentials are present in Apple's form, but were not validated against the production account system. No credentials were copied into this report. No legal agreements were accepted, no QA attestations were invented, and public App Review was not submitted.

## November 26 audit

- Fixed custom-goal context being ignored, selected focus skills being replaced, software goals using engineering templates, and mixed tracks skipping their first lesson.
- Added measurable Beyblade launch/matchup practice, corresponding project ideas, and concrete tasks for other advertised goal categories. Unrecognized goals use a general practice framework; this is a local template planner, not an external AI model.
- Plan reads the persisted profile, preventing partial navigation data from replacing its focus or cycle start. Goal selection no longer overwrites a saved plan before focus confirmation. Legacy mission IDs are retained for existing plans.
- Invalid mission links now recover to Plan instead of inventing a generic Day 1 task. Custom skill text is excluded from external searches.
- Fixed the binary/review gate deadlock: a new build requires an unused number; public review requires the existing finished candidate, exact-build screenshots, and verified manual gates.
- Fixed audit errors being accepted as clean dependency reports and concurrent Windows tests sharing a database.
- Verified TypeScript/lint, automated app logic, backend tests, SDK checks, dependency audit, and iOS Hermes bundle export; see command outcomes in this chat. The owner reports phone testing and confirmed the supplied welcome screenshot came from Build 24; this does not attest to Build 25 upgrade, accessibility, or two-provider email testing.
- Live TestFlight preflight passes, including API version 1.2.0, email readiness, and policy/support pages. Actual two-provider email delivery remains unverified.
- Operator legal name is Aayush Soni; recorded locally and in the Expo production environment. Support inbox was confirmed as rise.app13@gmail.com. Launch jurisdiction is Ontario, Canada and is configured locally and in Expo production. The App Review phone is recorded in ignored local state. The physical mailing address remains missing.
- Connected Render workspace `tea-d6cipd7gi27c7381mmng` returns 404 for RISE service `srv-daurrt7pn0mc738t94jg`; its unrelated services were not changed.
- App Store Connect remains blocked by a saved browser permission, including after the owner explicitly approved access. No current review status, rejection, questionnaires, screenshots, or Apple agreements were verified or changed.

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
- Expo Doctor passes all 21 checks, the iOS production bundle exports successfully, 68 app logic tests pass, and 38 backend tests pass.
- Recovery, verification, Privacy, Privacy Choices, Terms, and Safety screens honor the shared light/dark appearance and expose improved accessibility state.
- `app-store/` contains validated English metadata, conservative privacy/age-rating guidance, final review notes, and an exact-Build-24 screenshot plan.
- The fail-closed App Store submission gate validates metadata limits, manual Apple/QA attestations, reviewer contact, the existing finished EAS candidate, screenshot formats/dimensions/transparency, and the required current iPhone screenshot size before public App Store review.

## Before a new binary

Live TestFlight configuration passes. To make Build 24 a public-release candidate, first supply the verified operator mailing address and launch jurisdiction locally and in Expo production. `npm run appstore:build-upload` enforces this. Then build/upload the candidate, perform physical-iPhone QA, and capture screenshots from that exact build. Do not mark unperformed checks complete.

## Blocking before public App Store review

### Founder/legal information

1. `EXPO_PUBLIC_OPERATOR_LEGAL_NAME` is set to Aayush Soni. Set `EXPO_PUBLIC_OPERATOR_MAILING_ADDRESS` and `EXPO_PUBLIC_LAUNCH_JURISDICTION` to verified public facts in the EAS production environment. The in-app Privacy Policy, Terms, and Safety Disclosure now read these values and the App Store preflight rejects missing or placeholder values. Have qualified counsel review the final documents; this repository cannot provide a guarantee against legal claims.
2. Confirm the monitored support contact and a deletion-request contact/process.
3. Confirm the minimum audience age and complete the age-rating questionnaire truthfully. If RISE will knowingly serve children under 13, obtain a specific COPPA review before launch.

### App Store Connect metadata

Historical status was `iOS 1.0 · Prepare for Submission`; current status could not be rechecked because browser access was declined. The following gaps were directly observed in App Store Connect on November 4, 2026 and must be rechecked before submission:

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


## Follow-up release verification

- Backend commit f420455d79f90209d5d3b1aa4294063f9af104f3 is live on Render (deployment dep-dc4d63uc6qcc73d762ig). Health returned 200, API 1.2.0 and email readiness passed, and a bounded oversized streamed request returned 413.
- 45 backend tests passed after atomic refresh/reset/verification token consumption, streamed-body limits, input limits, and FastAPI 0.165.0 / Starlette 1.10.0 upgrades. Python requirements audit reports no known vulnerabilities; npm audit reports no critical/high/moderate findings.
- Build 24 was compiled using Xcode 26.6. Build 25 intentionally opts SDK 57 into the UIKit scene lifecycle and pins macos-tahoe-26.6-xcode-27.2. Expo introspection confirms an UIApplicationSceneManifest with EXExpoAppSceneDelegate.
- The original Build 24 welcome screenshot is 1179 x 2556 JPEG with no alpha and passes file validation. Its manifest stays marked Build 24; it must not be relabelled as Build 25.


## Build 25 upload result

EAS build 511e4f28-004a-48c1-a6bc-273f72536a1e finished and EAS submission 6d411024-f37f-4645-bd38-bcecdaeb237f successfully uploaded version 1.0.0 (25) to App Store Connect. Native build logs confirm Xcode 27.2. Apple processing, tester-group availability, and public App Review state have not been verified through the blocked Apple browser. The Build 24 screenshot remains valid only for Build 24; final Build 25 captures and exact-build device attestations are pending. The public operator mailing address remains unresolved.


## Final follow-up while owner is away

- Build 25 remains FINISHED in EAS and was successfully uploaded to Apple; no redundant binary was created.
- Corrected the listing description and review notes: photo/video proof is required to finish a mission, rather than optional. All metadata files pass local length/URL checks.
- Public-release identity validation now rejects email contacts as physical addresses and requires Canadian postal-code syntax for the stated jurisdiction. This is a syntax check, not independent factual verification of an address.
- 68 app logic tests now pass. The latest runtime verification remains 45 backend tests, 21 Expo Doctor checks, successful native iOS 27.2 compilation, clean dependency audits, and live API health/streamed-body protection.
- User again supplied rise.app13@gmail.com as a mailing address and referred to phone testing of Build 5. Neither statement supplies a physical postal address or verifies Build 25 device QA. No missing attestation was marked complete.
- Apple guideline 2.3.3 calls for screenshots showing the app in use; the single welcome image alone does not establish an adequate final screenshot set. The supplied image remains recorded as Build 24.
- Public submission could not be performed: saved Apple browser denial persists, the physical address is missing, and final screenshots/device checks/reviewer setup/Apple declarations remain unverified.
