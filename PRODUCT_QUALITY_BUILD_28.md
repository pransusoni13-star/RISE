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

New regressions cover written completion without media, required attestations, practical feedback adaptation, stable mission identities, later-round comparison, unreadable/corrupt storage preservation, concurrent saves, reopening written results, and retry after failed writes. All 86 app tests passed locally. Type checking, lint and Expo dependency checks passed during the pass; an iOS Hermes export also passed. CI verifies the final committed revision before merge. Build receipts will be recorded after completion.

## Boundaries

Exact-build iPhone upgrade, camera/video behavior, VoiceOver, large text and visual inspection still require native execution. The currently pending Apple address verification is a separate manual workflow. Previously supplied Build 24 screenshots cannot be relabelled. Apple metadata must be updated from these source files once browser control returns. No new backend API or external AI provider is introduced, and no engagement improvement is claimed as measured user evidence.
