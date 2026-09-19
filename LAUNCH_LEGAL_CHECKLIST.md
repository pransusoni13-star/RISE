# RISE pre-launch privacy, security, and legal checklist

This is an engineering checklist, not legal advice. Have counsel adapt the final policies to the company, launch countries, age audience, data flows, and business model.

## Before any public beta

- Formally identify the business/entity operating RISE and publish working support and privacy contact details.
- Have counsel review and publish a Privacy Policy and Terms of Service at stable public URLs; link both in the app-store listings and inside the app.
- Document every collected field, why it is needed, where it is stored, how long it is retained, who receives it, and how a user deletes or exports it.
- Decide the minimum supported age. If children under 13 may use the app, complete a COPPA review before collecting identifiers, accounts, analytics, or proof media.
- Treat fitness, wellness, finance, medicine, and mental-health missions as higher-risk content. Avoid diagnosis, treatment, guaranteed outcomes, or individualized professional claims.
- Obtain explicit permission only at the moment camera/photo/video access is needed. Do not request contacts, precise location, or background access for the current product.
- Add in-app export and delete controls before adding cloud accounts. Deletion must cover profiles, mission history, proof objects, analytics identifiers, and backups according to the published retention policy.
- If analytics or advertising is added, update the data map and policy first. Block non-essential tracking until valid consent where required, including in relevant EU/UK contexts.
- Keep secret API keys and privileged database credentials server-side. Scan production bundles and repositories for secrets, rotate any exposed credential, and enforce database row-level authorization.
- Add authentication hardening, rate limits, abuse controls, encrypted transport, secure media access rules, backup/restore testing, dependency scanning, and an incident-response process before cloud proof upload.
- Confirm licenses for fonts, icons, images, audio, videos, copy, templates, and third-party code. Do not copy another app’s distinctive branding, assets, or text.
- Test accessibility: screen-reader labels, text scaling, contrast, reduced motion, keyboard/web navigation, and minimum touch targets.
- Verify every marketing statement against what the product actually does. Do not claim “AI,” “secure,” “HIPAA compliant,” guaranteed improvement, or professional outcomes unless demonstrably true and legally reviewed.
- Complete Apple App Privacy and Google Play Data Safety disclosures from the real production data flow, not from assumptions.
- Provide a real, monitored support contact and Support URL. Apple requires reachable developer contact information.
- If proof or posts ever become visible to other users, add filtering, reporting, blocking, published contact information, and a staffed moderation process before launch.
- If accounts are added, provide in-app account deletion and a public deletion-request path before Google Play submission.
- If the app is likely to be used by children, complete an age-audience decision, COPPA assessment, and applicable age-appropriate-design assessment before collecting proof, location, identifiers, or analytics. Default to data minimization and high privacy.
- Keep rewards transparent and non-cash unless a separately reviewed payments system is added. Never describe RISE Coins as money or an investment.

## Current MVP posture

- Personalization, mission state, progress, rewards, and proof metadata are stored locally with AsyncStorage.
- Selected proof media is not uploaded to a RISE cloud service.
- RISE does not include analytics, advertising SDKs, authentication, payments, or a cloud database.
- YouTube and Google Maps open as external supporting resources.
- The repository contains no detected common secret-key patterns as of the latest engineering check.

## Required repeat review

Repeat this audit whenever RISE adds accounts, cloud sync, analytics, subscriptions, ads, social sharing, precise location, health integrations, AI APIs, or support for minors.

## Primary requirements reviewed (September 18, 2026)

- [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) — safety, app completeness, privacy, support contact, accurate claims, and user-generated-content safeguards.
- [Google Play User Data policy](https://support.google.com/googleplay/android-developer/answer/10144311) — privacy policy, accurate Data Safety disclosures, secure handling, permissions, and deletion requirements.
- [FTC mobile health app guidance](https://www.ftc.gov/business-guidance/resources/mobile-health-apps-interactive-tool) — wellness-data privacy, truthful claims, and breach obligations that may apply.
- [FTC children’s privacy guidance](https://www.ftc.gov/business-guidance/privacy-security/childrens-privacy) — COPPA responsibilities for services directed to or knowingly collecting from children under 13.
- [UK ICO Children’s Code](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/age-appropriate-design-a-code-of-practice-for-online-services/) — high privacy by default, data minimization, and geolocation off by default for services likely to be accessed by children.
