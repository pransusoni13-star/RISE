# Release verification — November 27, 2026

Build 27 supersedes Build 26 because the follow-up found additional app defects. Version 1.0.0 (27) is uploaded, processed, Testing in the public TestFlight group, and selected/saved as the App Store candidate. The public App Store version remains Prepare for Submission. No public App Review submission or phone QA is attested.

## Seven-area result

| Area | Completed evidence | Remaining boundary |
| --- | --- | --- |
| Goal quality | Fixed subject-versus-study matching and unrelated program/hooks matches; regression cases cover Beyblade, piano, photography, programming, fitness, law, medicine, and unknown custom goals. | Plans use local templates. An unfamiliar subject still uses a general practice framework. No guarantee of achieving an ambition or external AI integration is claimed. |
| Website and privacy | Production operator fields saved on Vercel; the published privacy page shows the owner-supplied identity and November 27 wording, disabled rankings, and retained-data locking. | Operator factual rights declarations remain separate. |
| Account, offline, export, reward behavior | Fixed in-flight profile acknowledgment deleting a newer offline edit. Added queue concurrency/storage-failure and complete-versus-partial client export tests. Existing auth, isolation, revocation, daily-budget, deletion and reward tests pass. | Exact-build device upgrade, notifications, permissions and two-provider mail checks remain unperformed. |
| Accessibility and media | Reject missing/invalid file sizes, malformed numeric metadata and remote proof URLs; stat native files when available. Unreadable image previews cannot pass proof review. Improved labels, control states, touch targets and flexible submit-button height. | VoiceOver, large text, denied/revoked permissions, video decoding, sandbox/backup behavior and malformed-media memory behavior require a real device. |
| Cloud security and recovery | Verified live private-table protections and empty storage buckets. Enabled and read back Supabase SSL enforcement. Restricted direct database access to both outbound IPv4 ranges listed by the existing Render service. API database-backed health and public catalog read still return 200. | Client certificate/hostname verification, broader IAM/key scopes, owner MFA, incident alerts and restore testing remain incomplete. Supabase Free explicitly has no scheduled backups. |
| Artifact and dependencies | Inspected actual Build 26 and 27 IPAs: expected bundle, SDK iphoneos27.2, debug entitlement false, no arbitrary ATS loads or document sharing, expected update project/runtime, no background modes, and bundled privacy manifests checked for tracking declarations. Full-history Gitleaks and fresh-image Trivy added to CI. Fixed an OS libzstd1 advisory through distribution package updates; the image rescan passes. | Windows cannot cryptographically verify Apple signatures or perform a native runtime pentest. CI builds/scans the same Dockerfile, but does not establish byte-for-byte identity with Render's separate image. The Trivy gate covers fixable HIGH/CRITICAL findings, not every severity or future advisory. |
| App Store | Build 27 public beta Testing verified; candidate saved; review instructions updated. Availability changed from 175 territories to Canada only, future-country auto-enrollment disabled, and untested Mac/Vision Pro distribution disabled. Free Apps Agreement is Active. | Exact-build screenshots, reviewer-login validation, content-rights declaration and accessibility/device checks remain. Apple's business postal correction is unsaved because its 2FA code was rejected. |

## Receipts

- Source PR: https://github.com/pransusoni13-star/RISE/pull/35 — merge 4bd2b0aca691e937e20d6ab925b08e4fd2ced469.
- Main CI: https://github.com/pransusoni13-star/RISE/actions/runs/46075485689 — verify, secrets and container jobs passed. 76 app tests and 54 PostgreSQL tests passed there; SQLite passed 53 with one PostgreSQL-specific skip. Two additional client export tests subsequently passed locally, bringing app coverage to 78 tests without changing the shipped runtime.
- EAS: https://expo.dev/accounts/rise.0/projects/RISE/builds/fade0393-fe6f-4a38-8383-d6b947fe28e7 — finished. Submission 24d64071-86e7-4960-ae0f-35019e663e74 uploaded successfully. Apple build ID 6d1456a2-f705-48c7-923c-b22b18b0cfc5, received at 5:22 PM Toronto.
- TestFlight: https://testflight.apple.com/join/gwYy6GNr — Build 1.0.0 (27) Testing in RISE Public Beta; internal group also assigned.
- Build 27 IPA SHA-256: `63b09d779fc21bc00c8dddfc5b7df35426b0e3489c9005a8d1dc7453a196daec`.
- Render deployment: dep-dc50667f3r2c73d0pbb0, Live on 4bd2b0a. Public configuration reports that commit, API 1.2.0, email readiness true and private-table readiness true.
- Vercel production: GBjbhyRsxRzti8TeFCU3vKM6X835, Ready on 4bd2b0a; published policy inspected at https://rise-daily-skill-missions.vercel.app/privacy.

## Secret-scan interpretation

Full Git history scanning found no matching secrets in 99 commits at the initial run; the expanded CI scan also passed. Build 27's printable-binary scan raised 239 generic-pattern hits: 238 matched code-signature digest-shaped strings and one was a string in the native SDWebImage binary. These are not confirmed application credentials. They were reviewed rather than described as a clean zero-hit scan. This is pattern-based evidence, not proof that no secret or unknown vulnerability exists. Raw IPA, extracted strings and reports remain in ignored local audit storage.

## Operational observations

- Supabase project metadata matches the RISE schema. All sixteen public tables inspected have RLS enabled. The thirteen private RISE tables show Data API access disabled/no policies; the legacy waitlist and skill catalog also have no Data API RLS policies. No customer rows were opened. Storage metadata reports zero buckets, including zero public buckets.
- SSL enforcement is confirmed enabled after reloading the dashboard. Direct network access is limited to the two Render-listed shared outbound ranges. These ranges are shared infrastructure, so database credentials and authorization remain necessary. Future direct backup/admin clients will need a deliberate, narrow network entry; Supabase HTTPS services remain separate.
- The database connection sample contained both SSL and non-SSL connections before enforcement. It did not establish which client owned each connection or certificate verification. Do not use that earlier sample as evidence that all app connections had been verified.
- Render failure notifications use the workspace default (Only failure notifications); receipt of an actual alert was not proved. Vercel displayed that its account uses single-factor authentication. No account MFA enrollment, password reset, key rotation, or paid upgrade was performed.
- Production mail provider is SMTP and the sender uses the owner-authorized Gmail address. The inspected Resend account has no verified domains and no sent emails in its displayed fifteen-day window, but it is not the active provider. No domain purchase is needed merely to keep the existing SMTP configuration. Actual two-provider delivery still needs testing.
- Apple business records have a different postal code from the owner-supplied release identity. The correction was prepared, but Apple requested 2FA and rejected the supplied code. Its Free Apps Agreement is Active; the new Paid Apps Agreement was not accepted because this release has no paid products. Canada-only availability satisfies the release gate's non-EU alternative without declaring trader status.
- Local web test startup with a localhost API override was previously rejected by automatic approval review; no bypass was attempted. Public welcome and policy rendering were inspected separately. These observations do not replace an end-to-end device test.

See `app-store/OWNER_RELEASE_ACTIONS.md` for the consolidated owner handoff.
