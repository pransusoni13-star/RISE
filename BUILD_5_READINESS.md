# RISE build 5 hardening record

Updated: 2026-10-02

Build 5 is a compatibility-preserving update over TestFlight build 4. It keeps the same bundle identifier, storage keys, account API, app version, and EAS runtime policy. Installing it over build 4 should retain the member's on-device profile, missions, rewards, and proof references. Deleting the app can still remove on-device-only data and proof references.

## Completed in code

- Durable, bounded on-device outbox for signed-in profile and progress updates. Failed requests retry at launch, foregrounding, and from Settings instead of being silently discarded.
- Visible sync state and manual retry in Settings.
- Signed-in feedback submission to the authenticated API, with local storage and share-sheet fallback for guests or outages.
- Feedback validation, per-IP throttling, account export, account deletion, and aggregate operator counts.
- Duplicate local proof-file reuse is blocked across different missions. The UI now accurately states that RISE does not inspect media content.
- Topic-relevant five-question cycle banks now cover coding, creator work, fitness, barbering, engineering, design, business, communication, finance, wellbeing, spirituality, and study goals, with a generic fallback for other goals.
- Privacy and legal disclosures cover feedback delivery and offline sync behavior.
- TestFlight preflight checks the build number shape, runtime policy, update channel, platform claim, public API URL safety, health endpoint, privacy URL, and support URL.
- TestFlight auto-increment is disabled so the next binary uses the explicitly reviewed iOS build number `5` rather than unexpectedly becoming build 6.
- CI uses a time-limited, explicit exception for the current Expo 57 `node-forge` advisory chain rather than applying npm's incompatible downgrade. Critical or unfamiliar high-severity findings still fail CI; the exception expires on 2026-11-15.

## Intentionally not claimed as code-complete

These require an owner decision, third-party configuration, professional work, Apple action, or physical-device evidence. They are not honestly fixable by editing this repository alone.

- Apple TestFlight or App Store approval.
- A public invitation link that works before external approval.
- Professional legal advice, entity registration, trademark clearance, or country-by-country compliance.
- Independent penetration testing and infrastructure audit.
- Guaranteed notification delivery, guaranteed outcomes, or an “unhackable” system.
- Sign in with Apple or Google without provider credentials, account-linking policy, revocation handling, and signed-device testing.
- Remote push, SMS, or email accountability without an opt-in delivery service and operational budget.
- StoreKit subscriptions, refunds, and founding-member billing without an approved commercial plan.
- Human or AI inspection of proof media without a separate privacy-reviewed moderation service.
- Full localization, iPad support, Android release certification, or professional accessibility certification.
- Verification of hosting backups, restores, shared rate limiting, monitoring, and email deliverability without access to the production provider configuration.

## Required before uploading build 5

1. Deploy the backend update and verify `/health`, registration, login, feedback, export, and deletion against production.
2. Run `npm run check`, `npm run test:logic`, `npm run security:audit`, backend pytest, and `npm run testflight:preflight` using the real production environment values.
3. Install an internal signed build over build 4 and verify that existing data remains.
4. Complete the full physical-iPhone journey in `TESTFLIGHT_RUNBOOK.md`, including offline/reconnect and pending-sync recovery.
5. Upload build 5 only after build 4's review outcome is known, unless build 4 reveals a critical security or account failure.
