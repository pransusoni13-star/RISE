# Product quality pass — Build 28

Build 28 is the next candidate after 27. This pass improves concrete product behavior; it does not establish a perfect rating or measured retention.

## Changes

- Written completion is the default. The reflection already written during the mission is reused as the result note; users do not have to write the same lesson twice. Photos and videos remain optional, with the same reward for every evidence format. Self-attestation and local result/reflection checks remain; the app does not claim independent verification.
- Feedback changes actual work: time creates a limited session, tools offers clearly labelled preparation, clarity provides explicit instructions, confidence/hard difficulty asks for a smaller private attempt, and low usefulness asks for a concrete application. Easy feedback adds controlled comparison. Later rounds compare saved results and quality constraints instead of only changing a level label. Existing mission IDs remain stable.
- Today shows the actual saved win and allows reopening it. Progress shows recent saved results and lessons alongside participation metrics. Corrected fixed seven-day text for longer cycles and replaced rank-trial jargon with cycle quiz. Project results return to Progress rather than incorrectly prompting the current cycle quiz.
- Improved shared button padding, Today typography/wrapping, feedback touch targets, semantic labels/selected states and several light-mode text colors. Proof submission and feedback use immediate locks. Feedback selection is shown only after persistence succeeds.
- Mission history read failures and malformed storage now propagate errors without overwriting history as an empty object. Serialized writes retain concurrent records. Result screens wait for stored records and report load failure.
- Store description, reviewer notes, tour/help and privacy/legal copy match written results and disabled competitive rankings. Written results/reflections remain local; only existing progress metadata is sent to the account service.

## Verification

New regressions cover written completion without media, required attestations, practical feedback adaptation, stable mission identities, later-round comparison, unreadable/corrupt storage preservation, concurrent saves, reopening written results, and retry after failed writes. All 86 app tests passed locally. Type checking, lint and Expo dependency checks passed; an iOS Hermes export also passed. PR and main CI passed app/backend verification, history secret scanning and container scanning.

- Source: https://github.com/pransusoni13-star/RISE/pull/39 — merge `daa33f22f17a1a0890ab2e16389233f4ccf322b1`.
- Main verification: https://github.com/pransusoni13-star/RISE/actions/runs/46090494798 .
- EAS Build 28: https://expo.dev/accounts/rise.0/projects/RISE/builds/468faf2b-603d-4888-8762-a778fa301843 — finished successfully.
- Apple submission: `77617f60-c6f5-4fa3-b241-4b980e30afce` — upload succeeded. Apple's API reports Build 28 `VALID`, internal state `IN_BETA_TESTING`, external state `READY_FOR_BETA_SUBMISSION`, not expired. Received November 27 at 8:02 PM Toronto. The existing internal beta group was configured in the submit profile; public beta distribution and App Store candidate selection are not claimed for 28.
- Actual IPA SHA-256: `1ad7f582db6bcfa098613ee8534779b4171453e9d5541677edb04ce98f48d6f1`.
- Actual artifact: expected bundle/version 1.0.0 (28), SDK iphoneos27.2, minimum iOS 16.4, debug entitlement false, file sharing false, no arbitrary ATS loads, and no bundled privacy-manifest tracking declarations. This is metadata inspection, not cryptographic signature verification or runtime testing.
- Artifact pattern scan raised 238 generic matches. Context review identified 237 signature-digest contexts and one previously observed native SDWebImage device-info string. No confirmed credential was identified; this is not a zero-hit or exhaustive secret-clearance claim. Raw artifacts and scan reports remain ignored local audit files.

## Boundaries

Exact-build iPhone upgrade, camera/video behavior, VoiceOver, large text and visual inspection still require native execution. The currently pending Apple address verification is a separate manual workflow. Previously supplied Build 24 screenshots cannot be relabelled. Apple metadata must be updated from these source files once browser control returns. No new backend API or external AI provider is introduced, and no engagement improvement is claimed as measured user evidence.
