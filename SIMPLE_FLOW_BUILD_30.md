# Simpler daily practice — Build 30

The default journey now asks for one direction and a time budget, opens the task directly, and shows one action step at a time. The age and privacy check remains required. The detailed survey, tour, notes, media attachments and quiz are optional.

## Changed behavior

- Native and web welcome screens share a shorter layout and a clear first-task action. Quick start offers six directions, a custom goal, and 5, 10 or 20 minutes. A specific Beyblade goal produces a launch-consistency task; coding starts with programming rather than framework-specific typed props.
- Today focuses on one task, with a small week indicator and a locked preview of tomorrow. Three visible tabs are Today, Learn and Progress. Planning and Settings remain available in the header; the tour can be replayed in Settings.
- Completing the final action step saves a self-reported win directly. No mandatory reflection length, photo or separate review form interrupts this default path. Optional media review remains available. The success screen offers optional difficulty feedback.
- Completion checks current consent, retained account ownership, the canonical saved plan, all action steps, and daily availability. Serialized writes and the existing reward source prevent duplicate taps or an interrupted record save from granting duplicate XP/coins. Private notes are not added to sync events.
- Difficulty changes stay within the selected time budget. After a completed week, the next local calendar day permits a fresh cycle with the same goal and time budget; its practice level advances. Missing, malformed or future completion timestamps do not open that continuation. Quizzes remain optional on Today.
- Existing saved plans, detailed planning routes and optional proof workflows remain supported. The privacy and review copy explains self-reported completion.

## Verification

104 app logic/regression tests passed locally, including every quick-start direction and time budget, specific Beyblade tasks, difficulty budgets, cycle continuation, duplicate completion, interrupted writes, consent, ownership and day locks. TypeScript, lint and dependency checks and web export passed locally. PR and main CI passed app/backend tests, iOS export, dependency audits, secret scanning and the container scan. Daily unlocks now compare local calendar dates correctly across daylight-saving changes; the regression test runs in the Toronto timezone.

Visual browser review is pending while the owner completes Apple authentication under manual control. Exact-build iPhone upgrade/retention, VoiceOver, large text, permissions, offline behavior and screenshots remain unverified for this build. Tests and successful compilation do not establish engagement or retention. No 10/10 claim is made.

Build 30 is built, uploaded and processed for internal TestFlight testing. Apple metadata updates, external beta distribution and App Review submission are not represented as completed.

## Release receipts

- Source: https://github.com/pransusoni13-star/RISE/pull/41 — merge `ebe0a58c67164bb063ac5ae4ecc53b624fea2395`.
- PR CI: https://github.com/pransusoni13-star/RISE/actions/runs/46102691134. Main CI: https://github.com/pransusoni13-star/RISE/actions/runs/46102855478. Verify, secrets and container jobs passed. Vercel reports successful production deployment for the merge commit; this is not visual QA.
- EAS build: https://expo.dev/accounts/rise.0/projects/RISE/builds/01875264-802a-41df-a247-800e5b44981f — finished. Submission `7521381e-6567-49bd-94b4-67f6ebe4084b` uploaded successfully. Apple's API reports 1.0.0 (30) VALID, IN_BETA_TESTING internally, READY_FOR_BETA_SUBMISSION externally and not expired. Apple received it November 27 at 10:32 PM Toronto.
- Actual IPA SHA-256: `d0e581a4d35d35702ec01f9965ff4a69b6d3003b35eee0ac5bcf7f2c063b2191`.
- Actual artifact metadata: expected bundle/version/build, SDK iphoneos27.2, minimum iOS 16.4, debug entitlement false, document sharing disabled, expected update project/runtime, and no reported metadata problems. Bundled privacy manifests do not declare tracking.
- Pattern scan: 238 generic matches. Context review classified 237 signing-digest contexts (CodeResources and embedded cdhash lists), plus the previously observed native SDWebImage device-info string. No confirmed credential identified. This is not an exhaustive scan or code-signature/runtime verification. Raw artifacts and reports remain ignored locally.

Build 27 remains the last verified public beta and selected App Store build. The owner is still completing Apple verification under manual browser control. Returning browser control, exact-build phone QA/screenshots and reviewer-login validation remain necessary for public release. No previous device-test result was relabelled as Build 30.
