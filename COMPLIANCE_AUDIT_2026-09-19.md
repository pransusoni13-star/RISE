# RISE product, privacy, and launch audit

Date: September 19, 2026

This is an engineering audit, not legal advice or a guarantee against claims, investigations, rejection, or litigation. Requirements depend on the operator, users, data flows, claims, launch countries, and store configuration.

## Audit of the 20-item social-media checklist

| Item | Current RISE status | Required action |
|---|---|---|
| Privacy policy | In-app beta disclosure exists and reflects local-only storage. | Publish a counsel-reviewed policy at a stable public URL before store submission. |
| Terms of service | Beta limits and acceptable-use language exist in-app. | Publish operator-specific Terms at a stable URL and version acceptance records. |
| Refund policy | Not currently applicable because there are no payments. | Add subscription cancellation/refund language before enabling purchases; follow store and local consumer rules. |
| Cookie policy | No advertising/analytics cookies are currently implemented. | Add only if the website or web app begins using cookies or similar storage requiring disclosure. |
| Cookie consent banner | Not currently applicable. A fake banner would be deceptive. | Add consent before activating non-essential web cookies where required. |
| Form consent | Feedback warns against private data; beta age/limits acknowledgment is versioned locally. | Obtain separate, specific consent if cloud uploads, marketing, sensitive-data processing, or research are introduced. |
| Data minimization | Profile, mission, proof reference, progress, optional belief preferences, consent, and feedback are local. | Continue collecting only fields needed for visible features; define retention before cloud storage. |
| Third-party SDK audit | No analytics, advertising, authentication, or payment SDK is installed. External links use YouTube/Google Maps/Google Search. | Re-audit every release and vendor before adding an SDK. Document processor terms and data flow. |
| Dark patterns | No countdown, forced payment, disguised ad, or cancellation obstruction exists. | User-test onboarding, rewards, and future paywalls; keep declines and deletion as easy as acceptance. |
| Hidden fees | No purchases or fees exist. Rewards disclose no cash value. | Display price, billing period, renewal, trial conversion, cancellation, and taxes before purchase. |
| Fake reviews | No review content or rating manipulation exists. | Never fabricate testimonials, suppress negative reviews, or condition rewards on positive ratings. |
| Unsupported claims | The app avoids guaranteed health, income, grade, religious, audience, or career outcomes. | Evidence-check every store listing and advertisement; do not claim "secure," "AI," or guaranteed results without proof. |
| Accessibility text | Core interactive controls have roles/states; proof preview has a label. | Complete VoiceOver/TalkBack audit for all 32+ routes and label every meaningful image/icon. |
| Color contrast | Core palette uses high-contrast light text on near-black surfaces. | Measure every text/state combination against WCAG targets and test increased contrast on real devices. |
| Keyboard navigation | Native controls are Pressable/TextInput based. | Test web tab order, visible focus, activation, dialogs, and no keyboard traps before web launch. |
| Business details | Intentionally absent because no verified operator information was provided. | Add the true operator/business identity and monitored support contact before public release. |
| Children and age | Beta now requires a locally recorded 13+ confirmation. | This is not verified parental consent. Complete COPPA/children's-design review and age assurance before serving under-13 users or collecting children's data. |
| Email unsubscribe | Not applicable because RISE sends no email. | Add sender identity and working unsubscribe to every marketing email before email campaigns. |
| Asset licensing | App uses project assets, emoji, Expo/React Native packages, and external links. | Create an asset/license register and confirm rights for every icon, image, font, video, sound, template, and dependency before launch. |
| Data deletion | In-app control deletes known RISE local keys including profile, progress, missions, rewards, feedback, goal selection, and beta consent. | Add verified account deletion, proof-object deletion, processor deletion, and backup expiry when a backend is added. |

## Current third-party package posture

- Expo and React Native framework packages
- Expo Router
- AsyncStorage
- Expo Image Picker
- No advertising SDK
- No analytics SDK
- No crash-reporting SDK
- No authentication SDK
- No payment SDK
- No cloud database or media-storage SDK

Package presence alone does not prove that a future production build sends no data. Repeat network and binary inspection on the signed release build.

## Public-launch blockers

1. Verified operator/business identity and monitored support contact.
2. Public Privacy Policy, Terms, and support URLs.
3. iOS bundle identifier, Android application ID, signing, and store records.
4. Real-device accessibility, proof, offline, interruption, and crash testing.
5. Asset and open-source license register.
6. Final age audience and children/privacy assessment.
7. Subscription purchase, restore, entitlement, cancellation, and refund handling if monetization is enabled.
8. Authentication, encryption, authorization, export, deletion, retention, incident response, and backups if cloud features are enabled.
9. Human safety review for professional, physical, financial, medical, legal, and spiritual mission libraries.
10. Counsel review for the operator and every launch territory.

## Primary references

- Apple App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Google Play User Data policy: https://support.google.com/googleplay/android-developer/answer/10144311
- FTC mobile health app guidance: https://www.ftc.gov/business-guidance/resources/mobile-health-apps-interactive-tool
- FTC children's privacy guidance: https://www.ftc.gov/business-guidance/privacy-security/childrens-privacy
- UK ICO Children's Code: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/age-appropriate-design-a-code-of-practice-for-online-services/
