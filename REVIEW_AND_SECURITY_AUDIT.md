# RISE beta: review and security audit

Updated 2026-09-21. This is a code and checklist review, not an Apple approval, legal opinion, or penetration test. It covers the two Instagram screenshots supplied by the owner. The linked reel could not be independently played or its full comments inspected, so no unseen claims from it are treated as requirements. [Apple's App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) and [OWASP API Security Top 10](https://api-security.owasp.org/editions/2023/en/0x11-t10/) are the decision sources.

## App Review screenshot: 12 rejection claims

| Claim | RISE beta decision |
| --- | --- |
| Stripe in-app | No paid features or checkout exist. Do not add Stripe just to pass review. Implement compliant in-app purchasing before selling digital subscriptions; regional exceptions need specific review. |
| Missing Apple sign-in | RISE only has first-party email/password. Apple's additional equivalent-login rule applies when a third-party/social login is used. If Google sign-in is added later, reassess guideline 4.8. |
| Account deletion | Implemented inside Settings for signed-in users; test both server and on-device removal on a real iPhone. |
| Website in a box | RISE has native proof selection, on-device storage, mission controls, and mobile navigation. Verify the final iPhone build genuinely works beyond a web wrapper. |
| Broken demo login | Owner must supply a working, non-expiring App Review test account and exact review steps in App Store Connect. |
| iPad UI broken | iPad support is disabled in Expo config; still test iPhone-compatibility display on iPad if Apple offers it. Do not claim iPad optimization. |
| Outdated screenshots | Capture screenshots from the final signed build. Never use design mocks, another product, or screens showing unavailable paid features. |
| Coming-soon screens | Search the final build for placeholders and blocked actions; remove or finish them before submitting. |
| Broken links | Open every external video, guide, privacy, support, and terms link from the final device build and on cellular data. |
| Report feature | In-app Feedback/Help exists. Test it; do not claim live moderation or emergency reporting. |
| Restore purchase broken | No purchases exist. Do not advertise restoration until actual StoreKit purchases are implemented and tested. |
| Paid-feature screenshots | No paid features exist. Screenshots must reflect the free beta exactly. |

The screenshot comments disagree about Stripe; Apple's own guideline 3.1.1, not a comment, governs digital feature unlocks. Founding-member codes currently record a free-year promise but do not unlock paid features. Before any subscription launch, replace or formally review that promise with an Apple-compliant offer mechanism; do not use a private license code to unlock digital functionality.

## Security screenshot: 20 controls

| Control | RISE beta status / required action |
| --- | --- |
| HSTS | Added to production API responses and static-host policies; verify the deployed HTTPS response. |
| CSRF tokens | Bearer-token JSON API, no authentication cookies; CSRF tokens are not applicable to this design. Reassess if cookie sessions are introduced. |
| Reset sessions on password change | No password-change flow exists. Add a verified change/reset flow that revokes sessions before open public enrollment. |
| Expire reset links | No reset links exist. Add single-use short-lived tokens with an email provider when reset is implemented. |
| Prevent user enumeration | Login uses a generic error. Registration still reveals existing accounts with 409; change this with email verification/activation flow before open enrollment. |
| Whitelist upload types | Proof selection allows supported image/video types and bounds size/duration; proof stays local. Re-test native picker edge cases. |
| Verify payment webhooks | No payments/webhooks exist; required only if billing is added. |
| Set prices server-side | No prices exist; required if billing is added. |
| Block prompt injection | No server AI agent or model tool execution exists. External resources are links, not trusted instructions. Reassess if AI is added. |
| Cap AI usage | No metered AI API exists. Reassess if AI is added. |
| Limit request size | Event metadata capped at 2 KB; declared JSON bodies over 16 KB rejected. Production gateway must enforce actual request size for chunked bodies. |
| Rate-limit password resets | No reset endpoint exists. Future endpoint needs per-user and per-IP limits. |
| Sanitize before storing | Server validates and bounds structured fields; React renders user text without raw HTML. Avoid destructive sanitization of personal names/reflections; encode at output. |
| Lock down CORS | Production startup rejects non-HTTPS allowed origins. Set only exact owned web origins. CORS does not replace auth. |
| Disable directory listing | Static host configuration is deployment-specific; verify it on the actual host. |
| Remove default admin routes | Production FastAPI docs are disabled. Private analytics requires a separate admin key; verify it is not bundled into the app. |
| Lock accounts after failed logins | Per-instance login throttling exists; shared limiter and account abuse detection still required for public scale. Avoid easy-to-abuse permanent lockout. |
| Log security events | No centralized production security event monitoring yet. Add at deployment without logging passwords, tokens, proof, or sensitive preferences. |
| Secure cookie flags | No auth cookies exist. Reassess if the website gains cookie sessions. |
| Restrict DB permissions | Deployment task: dedicated least-privilege database user, private network, backups, and tested restore. |

## Hard gates before a public TestFlight link

### September 22 UI and dependency follow-up

Safe-area spacing now covers the tab bar and fixed controls on Plan, Action, Focus, and Proof. Proof uses a keyboard-avoiding layout with an in-flow submission footer; verify its behavior on a signed iPhone build. The web landing example now has a working skill-selection button, calmer styling, and reduced-motion support. The app explicitly uses its implemented dark theme.

Local verification: TypeScript, ESLint, Expo package compatibility, web export, and all six backend tests passed. Browser checks at 390px confirmed no landing-page horizontal overflow and working navigation from the example mission to popular skills to custom onboarding. These checks do not certify every screen or native device behavior.

`npm audit --omit=dev` reports 14 moderate dependency findings, arising from `decode-uri-component` (GHSA-vcc3-ghjq-m6fr) and `uuid` (GHSA-w5hq-g745-h8pq) plus their dependent packages. These are unresolved. The suggested force-fix changes Expo-related major versions; do not apply it without compatibility testing. The newer decoder also changes module format, so a blind override is not an established fix.

Preflight still fails for the missing iOS bundle identifier, EAS project link, production HTTPS API, public privacy URL, and public support URL. Supply real owner-controlled values; placeholders must not be treated as completion.

1. A production HTTPS API with managed PostgreSQL, secrets, backups, actual body-size enforcement, shared rate limiting, and monitored uptime.
2. A real Apple-owned bundle ID, public Privacy Policy and Support URLs, working reviewer account, accurate App Privacy answers, and final-build screenshots.
3. A signed iPhone build tested on a real phone away from the developer laptop: signup/login, guest mode, proof photo/video, permissions, quiz, export, deletion, offline/restart, and all links.
4. Fix or assess dependency advisories and conduct focused authorization testing and a human security review. No checklist can guarantee that an app is unhackable or that Apple will approve it.

The opt-in community ranking uses client-reported mission events. Its UI labels that limitation; it must not be marketed as a verified competition until proof verification and anti-cheat controls exist.

Use `npm run testflight:preflight` and `TESTFLIGHT_RUNBOOK.md` for the submission sequence. Invite a small internal group first. Share a public TestFlight link only after the first external beta review is approved and the main flows have been tested without blockers.
