# RISE security readiness

Updated: 2026-09-21

RISE beta includes an Expo client and a FastAPI/SQLAlchemy account service. Development uses SQLite; production is designed for PostgreSQL. Account, profile, and progress metadata can sync, while proof photos and videos remain on-device. There is no payment or advertising flow. Private operator usage analytics requires explicit opt-in; core progress remains available without it.

## Launch checklist status

| Control | Current status |
| --- | --- |
| Hide API keys | Implemented. No API credentials are present. Environment files are ignored. Expo `EXPO_PUBLIC_` variables must never contain secrets because they are included in client bundles. |
| Purge Git secrets | Checked. No common private-key or API-secret pattern was found in the working tree or Git history. Rotate and purge immediately if a credential is ever committed. |
| Database access | Implemented through server-side SQLAlchemy only; the client receives no database credential. Production must use a private PostgreSQL URL. |
| Record ownership | Implemented through authenticated user scoping on profile, dashboard, progress, export, and deletion routes. Add a focused authorization review before public launch. |
| Encrypt sensitive data | Implemented for the sensitive faith/trusted-source preference on native devices using platform protected storage with device-only accessibility. The web keeps that preference only for the current session. General progress is local and selected metadata also syncs to the account service over HTTPS in production. |
| Enforce server-side authorization | Implemented with bearer-token validation and server-derived user identity on every private endpoint. |
| Lock record access | Implemented by filtering every private query and mutation to the authenticated user ID. |
| Block field tampering | Locally validated, but a local-only client cannot be a security authority. Future rewards or billing must be calculated and enforced server-side. |
| Secure session cookies | Not applicable. RISE creates no sessions or cookies. Future web sessions must use Secure, HttpOnly, SameSite cookies with rotation and expiry. |
| Hash passwords | Implemented with Argon2 through `pwdlib`; raw passwords are never stored. |
| Rate-limit login | Register, login, refresh, and founding-code claims have per-instance limits. This does **not** stop distributed attacks. Add a shared gateway/Redis limit before inviting large public groups. |
| Add bot protection | Registration is a public write endpoint. Add gateway abuse controls and email verification before open public enrollment. |
| Parameterize queries | Implemented with SQLAlchemy expressions; no string-built user queries are used. |
| Validate all input | Pydantic bounds form and event fields; event metadata is capped at 2 KB, and declared JSON bodies above 16 KB are rejected. A reverse proxy must enforce actual body-size limits, including chunked requests. |
| Escape user content | Implemented by React Native/React text rendering, which does not interpret user strings as HTML. No raw-HTML rendering API is used. |
| Restrict file selection | Implemented. Proof is limited to one supported image or video, videos are limited to 60 seconds, known unsupported types are rejected, and size caps are 25 MB for images and 150 MB for videos. Files are not uploaded to RISE. |
| Trim API responses | Implemented with Pydantic response models and a dedicated export endpoint that omits password and token hashes. |
| Add security headers | Implemented for common static hosts through `public/_headers`, Vercel through `vercel.json`, and production API HSTS. Verify actual deployed responses before launch. |
| Force HTTPS | Hosting requirement documented and supported with HSTS and CSP upgrade rules. The production host must provide valid HTTPS before public release. |
| Scan dependencies | The release workflow runs `npm audit`. The 2026-09-21 scan reported **14 moderate transitive advisories** and no high/critical; investigate applicability and compatible fixes before external testing. Do not force an incompatible Expo downgrade. |

## Required before public backend launch

Deploy behind HTTPS with managed PostgreSQL; add migrations, backups, monitoring, a shared rate limiter, email verification/password reset, production secret management, separate development and production environments, retention documentation, and a focused security review. Re-test account deletion/export, analytics consent, and authorization against the deployed service before inviting beta users. This is not a penetration test.

This checklist documents engineering controls. It is not a penetration test, certification, or guarantee that the application is free of vulnerabilities.


## November 26, 2026 security and legal review

Scope: repository review, automated synthetic abuse tests, dependency checks, live read-only release checks, and official-source research. This is not a penetration-test certification or a legal clearance. No production load attack or mass account creation was performed.

### Security evidence

- Oversized display names (1,000 characters), 1,000-item goal lists, overlong goal/skill items, and excess focus items are rejected in automated API tests without creating a profile.
- The API now caps actual streamed request bytes at 16 KiB, independent of Content-Length. Chunked, dishonest-length, duplicate-length, and enormous-length cases have regression coverage. The middleware stops reading after the limit is exceeded.
- Existing tests cover account isolation, authenticated export/deletion, login throttling, one-time reset/verification tokens, refresh rotation, private analytics, and duplicate progress events.
- App tests cover duplicate rewards/proof restrictions, input validation, serialized saves, and invalid mission links.
- 65 app tests and 45 backend tests passed. npm audit found zero critical/high/moderate findings. Python dependency audit and production deployment status are recorded separately below after verification.
- Remaining operational risk: throttling is process-local, so it is not a distributed anti-bot or DDoS solution. Production gateway limits, monitoring, provider quotas, backup restoration, and real-device security testing still require verification. A user-controlled or modified device can alter local XP; self-reported activity is not independently authenticated competition evidence.

The request and parameter limits address the controls described in [OWASP API4 resource consumption](https://api-security.owasp.org/editions/2023/en/0xa4-unrestricted-resource-consumption/). Broader device testing should use [OWASP MASVS](https://mas.owasp.org/MASVS/03-Using_the_MASVS/); passing the tests above does not establish MASVS certification.

### Legal and platform risk register

| Area | Evidence and remaining work | Official source |
| --- | --- | --- |
| Canadian privacy | Review collected account/progress/feedback data, meaningful consent, minimal collection, access/deletion, retention, vendors and incident procedures against actual operations. Code and policy consistency is necessary; provider retention/backups are not established by source code. | [OPC business privacy guide](https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/pipeda-compliance-help/guide_org/), [mobile apps guidance](https://www.priv.gc.ca/en/privacy-topics/technology/mobile-and-digital-devices/mobile-apps/gd_app_201210/) |
| Children and teen audience | Existing intended minimum age is 13. A minimum-age statement alone does not resolve actual knowledge of younger users or child-directed marketing. Review onboarding and distribution; do not advertise a children's service without the necessary assessment and controls. | [OPC meaningful consent](https://www.priv.gc.ca/en/privacy-topics/privacy-for-businesses/appropriate-handling-of-personal-information/collecting-personal-information-and-consent/consent/gl_omc_201805), [FTC COPPA FAQ](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions) |
| Email | Account messages and marketing must be assessed according to their actual purpose. No marketing system is currently implemented. Before promotional email, establish the applicable consent, sender-identification and unsubscribe controls. Gmail is a contact address, not a postal mailing address. | [CRTC CASL FAQ](https://crtc.gc.ca/eng/com500/faq500.htm) |
| Claims and safety | Do not claim guaranteed improvement, guaranteed expertise, independently verified proof, an unhackable product, or immunity from legal action. Educational health/finance/law content must stay within its actual scope. Testimonials and efficacy claims need evidence. | [Competition Bureau performance claims](https://competition-bureau.canada.ca/en/deceptive-marketing-practices/types-deceptive-marketing-practices/performance-claims-not-based-adequate-and-proper-test) |
| Brand and content rights | RISE/Ryze name clearance is unresolved. A general search is not a trademark clearance. Verify confusingly similar marks, app name, domain/brand use, artwork, fonts, third-party instructional content, screenshots and licences. Beyblade references must not imply affiliation or use unlicensed logos/character artwork. | [CIPO trademark database](https://ised-isde.canada.ca/cipo/trademark-search/srch?lang=eng), [CIPO search guidance](https://www.ised-isde.canada.ca/site/canadian-intellectual-property-office/en/trademarks/additional-search-options) |
| International launch | Ontario is the operator's stated jurisdiction, not a restriction on App Store territories. Decide intended distribution before public launch. EU targeting or behavioural monitoring can introduce GDPR duties; Apple may require trader information for EU distribution. Do not select territories or legal declarations from assumptions. | [European Commission GDPR scope](https://commission.europa.eu/law/law-topic/data-protection/information-business-and-organisations/application-gdpr_en), [Apple review rules](https://developer.apple.com/app-store/review/guidelines/) |
| App Store review | Exact-build screenshots, truthful data/age declarations, accessible support/privacy links, deletion, working reviewer access, current agreements and an accurately described free service still need final Apple-side verification. | [Apple review rules](https://developer.apple.com/app-store/review/guidelines/), [screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/) |

Operator: Aayush Soni. Stated launch jurisdiction: Ontario, Canada (Brampton). Support email confirmed. App Review phone stored only in the ignored local submission state. A street/PO-box mailing address remains missing; the supplied Gmail address cannot populate it. The user reports their installed phone build works, but no exact-Build-24 upgrade/accessibility/two-provider-email attestation has been made.


Follow-up: refresh, reset, and verification tokens are now consumed atomically; concurrent refresh/reset requests are covered by API tests. FastAPI and Starlette were upgraded to 0.165.0 and 1.10.0, and the resolved production requirements audit reports no known vulnerabilities. Render deployment dep-dc4d63uc6qcc73d762ig is live at f420455; health and actual streamed-body rejection were verified. This does not establish complete attack resistance.
