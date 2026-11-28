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

103 app logic/regression tests passed locally, including every quick-start direction and time budget, specific Beyblade tasks, difficulty budgets, cycle continuation, duplicate completion, interrupted writes, consent, ownership and day locks. TypeScript, lint and dependency checks passed for the cycle change. The final web export completed successfully. CI is required for the final candidate, including the explicit account-lock route registration and the optional-projects link.

Visual browser review is pending while the owner completes Apple authentication under manual control. Exact-build iPhone upgrade/retention, VoiceOver, large text, permissions, offline behavior and screenshots remain unverified for this build. Tests and successful compilation do not establish engagement or retention. No 10/10 claim is made.

Build 29 is already uploaded and cannot receive these runtime changes. Build 30 requires a new artifact. Apple metadata, external beta distribution and App Review submission are not represented as completed by this source change.
