# Reliability follow-up — Build 29

Build 28 is already processed and testing internally. These further fixes change runtime code and require Build 29; they cannot be added to the already-uploaded Build 28 artifact.

## Fixed behavior

- Ten- and twenty-minute plans now generate the selected duration. Supported legacy time ranges remain accepted; unrelated numeric text does not become a time budget.
- Both progress-repository imports use the same storage implementation and mutation queue. Proof, quiz, daily-task, learning and reward updates read the latest state inside that queue instead of overwriting one another from stale snapshots.
- Failed reads and malformed top-level XP, profile and reward storage propagate recovery errors rather than silently returning zero progress or a fresh plan. Queue failures do not prevent a later successful retry. Missions already received the corresponding protection in 28.
- Reward coin deduction and its idempotency event are saved before the badge marker. If the marker fails, retry repairs it without a second deduction; a failed deduction cannot grant the marker. Prices come from the canonical reward catalog.
- Cloud profile restoration no longer copies protected faith/source fields into ordinary profile storage. Migration writes secure storage before removing the old fields and preserves partially migrated fields. Failed protected reads do not turn into empty preferences that a later save could erase. Malformed protected JSON remains deletable.
- Profile updates are serialized. Concurrent changes retain separate fields. Sensitive settings fields were removed from schedule route parameters; schedule changes preserve them through the profile service.
- Profile/progress sync returns after the owner-bound update is durably queued, then flushes in the background. A slow service no longer holds the local completion UI. Explicit sync retry still awaits delivery. A malformed queue raises a recovery error instead of being overwritten by the next event.
- Home, Projects, mission lists, Progress and Rewards distinguish loading/failure from an empty new account. Common recovery UI offers a safe next step. Schedule saving handles failure and duplicate taps; additional asynchronous preference/continuation errors are caught.

## Verification and limits

All 96 app tests passed locally. Regressions exercise real service modules against controlled storage: concurrent reward mutations across both repository imports; failed reads/writes and retry; reward-marker interruption and canonical pricing; cloud restoration/migration privacy; malformed-data preservation and deletion; concurrent profile fields; all selectable time budgets; and durable queueing while the cloud request remains unresolved. Tests do not execute a native phone or prove engagement/retention.

Exact-build upgrade, native storage lock behavior, camera/video, VoiceOver, large text and screenshot capture remain to be checked on a device. Apple verification is still under manual handoff. External TestFlight distribution, updated Store metadata/build selection and public App Review are not claimed by this source change.
