# RISE legal and growth audit — October 23, 2026

This is an engineering and product-readiness audit, not legal advice. No app can be made lawsuit-proof, guaranteed viral, or guaranteed to earn $10,000 per month. A licensed lawyer must review the final launch documents and business setup for the places where RISE is offered.

## Current recommendation

RISE is suitable for a measured TestFlight beta after the release checks pass. It is **not ready for App Store production release** until every launch blocker below is closed.

## Launch blockers that require founder action

1. **Publish the legal operator identity.** Add the operator's real legal name, required mailing address, country/province, and privacy-officer contact to the Privacy Policy and Terms. Do not invent an entity name.
2. **Obtain legal review.** Have a Canadian privacy/consumer lawyer review the final Terms, Privacy Policy, age approach, liability language, and planned launch countries.
3. **Authenticate the email sender.** Supply a RISE-owned domain, verify it with the email provider, publish SPF/DKIM/DMARC, set the production sender variables, and test delivery to multiple unrelated inboxes. An `@resend.dev` testing sender cannot reliably serve real users.
4. **Deploy the current API.** The public Render endpoint was observed serving an older API contract. Deploy the reviewed backend, run health/config checks, and verify account registration, verification, reset, feedback delivery, export, and deletion against production.
5. **Define production retention.** Record exact Render database backup and log retention, Resend/SMTP event retention, Vercel log retention, Expo/EAS retention, and deletion timelines. Update the policy if these differ from the current description.
6. **Complete App Store privacy answers.** Declare account identifiers, contact information, product interaction, user content, diagnostics, and any other collected data accurately, including provider practices. Add live Privacy Policy and Privacy Choices URLs.
7. **Real-device and accessibility QA.** Test the complete first-run, account, permission, proof, notification, quiz, day unlock, export, deletion, and update paths on supported iPhones with VoiceOver, text scaling, Reduce Motion, light/dark mode, offline/poor network, and denied permissions.
8. **Incident operations.** Assign an incident owner, configure alerts, keep an incident register, rehearse account revocation and user/regulator notification, and confirm a working support response process.
9. **Keep an account acceptance record.** The app now requires and stores the current acceptance version locally before account creation or onboarding. Before production, store an auditable server-side Terms/Privacy version and timestamp for signed-in accounts without collecting unnecessary device data.

## Changes completed in this code audit

- Split the legal experience into a Privacy Policy, Terms of Use, Safety Disclosure, and Privacy Choices page.
- Added separate links in onboarding, account, Settings, mobile landing, and web landing surfaces.
- Updated the local acceptance record to policy version `2026-10-23`.
- Named current provider categories and purposes in the Privacy Policy.
- Added cross-border processing, privacy rights, consent withdrawal, incident, and non-discrimination language.
- Added a practical export/delete/opt-out/permission guide.
- Required a 13+ and Terms acknowledgment before account creation, with direct Privacy, Terms, and Safety links, and saved the current acceptance version locally.
- Kept proof files local, optional analytics and comparison off by default, in-app account deletion, export, hashed passwords/tokens, rate limits, and short-lived sessions.

## Remaining product and $10K/month limitations

### Product value and retention

- **No validated retention yet.** Measure activation, Day-1, Day-7, and Day-30 retention by cohort before adding more features.
- **The core promise still needs proof.** The strongest proposition is “one clear, personalized mission that creates a visible win today.” Every first-session screen should lead to that outcome.
- **Time-to-value must be measured.** Target a useful mission start in under two minutes and first completed action in the first session. Existing analytics can measure signup and first-mission delay only when users opt in.
- **Learning outcomes are not validated.** Run structured beta interviews and pre/post skill checks. Do not claim effectiveness until results support it.
- **The app still has multiple secondary systems.** Projects, rewards, rankings, tour, quizzes, feedback, and settings should remain progressive disclosure—not compete with Today’s one primary action.
- **Notification reliability is local-device dependent.** A reminder can be delayed or disabled by phone settings. Remote notification campaigns require a separate lawful, consented system.

### Monetization and economics

- **There is no paid product.** RISE currently has no subscription, paywall, purchase restoration, cancellation, refund flow, or paid value proposition. Therefore current in-app revenue is $0 by design.
- **No pricing evidence exists.** Interview retained users before choosing a price. A $10K/month target could mean 500 users at $20/month or 1,000 at $10/month before store fees, taxes, refunds, support, and infrastructure.
- **Unit economics are unproven.** Measure conversion, churn, gross margin, support time, acquisition cost, and lifetime value before scaling paid acquisition.
- **Do not monetize children or sensitive preferences.** Avoid behavioral advertising; treat any faith, wellness, or future health-related data cautiously.

### Distribution and “viral” growth

- **There is no demonstrated referral loop.** A safe referral should share a public result or invitation, never private proof, reflection, ranking, email, or contact list without explicit choice.
- **No store conversion evidence.** App icon, screenshots, preview, subtitle, description, and support/privacy URLs need A/B-informed copy and real-user testing.
- **No credible social proof yet.** Use only genuine, permissioned testimonials and disclose incentives. Never fabricate reviews or outcomes.
- **Virality cannot be coded into existence.** It depends on repeated value, a share-worthy outcome, trust, distribution, and measurable retention.

### Reliability and security

- **Production/backend drift is unresolved.** The public API must match the reviewed code before relying on its privacy and deletion behavior.
- **Capacity is untested.** Run load tests against a staging environment before a large public launch; never stress production without a plan.
- **Provider outages remain possible.** Add operational monitoring, database restore drills, error budgets, and a public status/support process.
- **Upstream SDK advisories require ongoing review.** Re-run dependency and Expo checks before each binary.
- **Client-side checks can be bypassed.** Authorization and privacy decisions must remain enforced on the server.

## Legal/compliance map

| Area | Current safeguard | Remaining work |
|---|---|---|
| Apple privacy | In-app policy, deletion, export, permission explanations | Publish live URLs; complete accurate App Privacy answers; verify provider disclosures |
| Canada/PIPEDA | Purpose and choice disclosures, access/delete/export | Identify accountable organization/privacy officer; document safeguards and retention; response workflow |
| Quebec Law 25 | Consent choices and incident language | Named privacy officer, privacy impact assessment where required, incident register, cross-border assessment |
| CASL | No marketing email currently; account email is transactional | If marketing starts: valid consent records, sender identification, unsubscribe, suppression list |
| Children | 13+ gate; not in Kids Category | Decide launch ages/regions with counsel; current checkbox is not verified age assurance; under-13 use needs a different COPPA-compliant design |
| GDPR/UK GDPR | Access/export/delete/consent-withdrawal descriptions | Controller identity/address, lawful-basis record, processor agreements, transfer mechanism, DSR deadlines, EU/UK representative/DPO analysis |
| California privacy | No sale/share or ads disclosed | Reassess thresholds and sensitive-data duties as business/data volume grows; honor applicable requests |
| Consumer protection | No earnings/health/result promises; beta limitations | Keep all marketing and store claims evidence-based; disclose price/renewal/cancellation before monetizing |
| Accessibility | Native accessibility roles on major controls | Complete WCAG/mobile accessibility audit and device testing |
| Health data | Educational disclaimer; no health integration identified | Reassess FTC Health Breach Notification Rule and health laws before collecting health/fitness/mental-health data or connecting trackers |

## Source-of-truth data map

| Data | Location | Purpose | Choice/deletion |
|---|---|---|---|
| Guest plan, mission state, reflections, proof references | Device | Core app | Delete local data |
| Proof photo/video | Device only in current beta | Mission evidence | Remove in app/device; local deletion |
| Email, display name, password hash, verification state | Render-hosted API/database when deployed | Account/security | Export; account deletion |
| Goals, skills, schedule, mission/quiz events, minutes | Device and account service when signed in | Personalization/sync | Export; account deletion |
| Usage timing | Account service only after opt-in | Product improvement | Off by default; turning off removes timing events |
| Community comparison | Account service only after separate opt-in | Rank calculation | Off by default; leave comparison |
| Submitted feedback | Device copy and account service; support notification email | Support/product improvement | Account deletion; contact support |
| Transactional email data | Resend or configured SMTP provider | Verification/reset/feedback notice | Provider retention must be documented |

## Required official references

- Apple App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Apple account deletion: https://developer.apple.com/support/offering-account-deletion-in-your-app/
- Apple App Privacy Details: https://developer.apple.com/app-store/app-privacy-details/
- Office of the Privacy Commissioner of Canada, PIPEDA: https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/
- Canada anti-spam consent: https://ised-isde.canada.ca/site/canada-anti-spam-legislation/en/getting-consent-send-email
- Quebec privacy law changes: https://www.cai.gouv.qc.ca/protection-renseignements-personnels/sujets-et-domaines-dinteret/principaux-changements-loi-25
- Quebec privacy incidents: https://www.cai.gouv.qc.ca/protection-renseignements-personnels/information-entreprises-privees/incidents-confidentialite-mesures-securite-entreprises
- FTC children’s privacy: https://www.ftc.gov/business-guidance/privacy-security/childrens-privacy
- FTC mobile health apps tool: https://www.ftc.gov/business-guidance/resources/mobile-health-apps-interactive-tool
- EU GDPR: https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng/
- California CCPA: https://oag.ca.gov/privacy/ccpa
