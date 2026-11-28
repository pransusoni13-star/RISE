# RISE App Store Connect submission pack

Updated: 2026-11-27 — current candidate: 1.0.0 (30)

This pack contains final-quality copy based on features verified in the repository. It is not proof that Apple will approve the app, and it does not replace exact-build device testing, truthful App Store Connect answers, or qualified legal review.

## Locale files

Use the files in `app-store/metadata/en-US/` for the United States English localization:

- App name: `RISE: Daily Skill Missions`
- Subtitle: `Daily missions for real growth`
- Recommended primary category: **Education**
- Recommended secondary category: **Productivity**
- Support URL: `https://rise-daily-skill-missions.vercel.app/support`
- Marketing URL: `https://rise-daily-skill-missions.vercel.app/`
- Privacy Policy URL: `https://rise-daily-skill-missions.vercel.app/privacy`
- User Privacy Choices URL: `https://rise-daily-skill-missions.vercel.app/privacy-choices`

Confirm categories against the exact submitted build. Do not select Health & Fitness unless the final presentation and claims support that category; RISE includes optional fitness goals but does not provide medical or treatment advice.

## App Privacy questionnaire baseline

Reconfirm every answer against the exact release binary and production services before saving Apple's questionnaire.

| Apple data type | Current code baseline | Linked to identity | Tracking | Purpose |
| --- | --- | --- | --- | --- |
| Contact Info · Name | Display name is processed for an account | Yes | No | App Functionality |
| Contact Info · Email Address | Required for account sign-in, verification, recovery, support, and deletion | Yes | No | App Functionality; Developer Communications when requested |
| Identifiers · User ID | Internal account identifiers and session records | Yes | No | App Functionality; Security |
| User Content · Other User Content | Selected goals, custom goal text, schedule preferences, and explicitly submitted feedback | Yes for signed-in members | No | App Functionality; Customer Support |
| Usage Data · Product Interaction | Mission, quiz, progress, skill, and focused-minute metadata used for sync; signup/app-session timing only when separately opted in | Yes for signed-in members | No | App Functionality; optional Analytics |

Current code indicates the following are **not collected by RISE**: proof photos, proof videos, audio recordings, precise or coarse location, contacts, browsing history, search history, purchases, payment information, health records, financial information, advertising identifiers, and data used for third-party advertising or cross-context tracking.

Technical infrastructure providers may retain operational logs. Recheck whether the final production configuration causes any Apple Diagnostics category to be collected and disclose it if it does. Do not mark optional timing analytics as required collection; it is off by default and controlled separately.

## Age-rating baseline

- Not in the Kids Category.
- Product terms state an intended minimum age of 13, subject to local consent rules.
- No public user-generated content, messaging/chat, contests with prizes, gambling, loot boxes, simulated gambling, alcohol/tobacco/drug content, sexual content, graphic violence, horror themes, or advertising is implemented.
- RISE includes optional fitness, wellbeing, nutrition-basics, and faith/spirituality goal paths. It explicitly does not provide medical treatment or professional advice.
- Curated guides and mission-specific YouTube or Google Maps links open an external provider. Confirm Apple's current wording for unrestricted web access against the exact build; RISE does not contain a general-purpose in-app browser.

Answer Apple's current questionnaire literally. If the final build, links, or content catalog changes, reassess instead of copying this baseline blindly.

## Accessibility questionnaire baseline

The code provides accessibility roles and labels on key controls, system light/dark appearance, and ordinary React Native text scaling. Do not claim full support until the exact Build 29 binary passes the physical-device checks below:

- VoiceOver focus order, names, values, hints, and modal behavior on every primary flow.
- Dynamic Type at the largest accessibility sizes without clipped controls or unreachable actions.
- Sufficient contrast in light and dark modes.
- Reduce Motion behavior and absence of essential information conveyed only by animation.
- Switch Control/keyboard reachability and touch targets of at least 44 by 44 points.
- Captions or equivalent information for any instructional media presented as required content.

Only select accessibility features in App Store Connect that the tested binary genuinely supports.

Apple's current Accessibility Nutrition Labels guidance says the labels are voluntary initially. They may remain unpublished while support is evaluated; do not invent support or treat an uncompleted optional label as a mandatory submission field. Exact-build device accessibility QA remains part of RISE's release checklist. Source: https://developer.apple.com/help/app-store-connect/manage-app-accessibility/overview-of-accessibility-nutrition-labels/ . Recheck the live requirements before each release.

## Final App Review notes

Copy `app-store/metadata/en-US/review_notes.txt` into Review Notes. Enter the reviewer credentials only in Apple's protected App Review Information fields, never in this repository, source control, screenshots, or review-note copy.

Required App Review contact fields:

- First name: **Aayush**
- Last name: **Soni**
- Monitored email: **rise.app13@gmail.com (owner confirmed)**
- Reachable phone number: **Already supplied and recorded in local submission state/App Store Connect**
- Active reviewer account: **Credentials are entered in App Store Connect; successful access to Build 29 still needs validation**

## Screenshot capture plan

Screenshots must come from the exact processed Build 29 binary on the required iPhone display sizes shown by App Store Connect. Do not use a design mock, web build, an older build, placeholder legal text, developer menus, or personally identifying test data. The existing Build 24 welcome capture is historical.

Recommended sequence:

1. **One goal. One clear next step.** — Growth-path selection with Career, Life, and Balanced choices.
2. **Know exactly what to do today.** — Today screen showing the single primary mission and its value.
3. **Learn by doing.** — Mission action steps with a concise example or guide.
4. **Prove it. Reflect. Improve.** — Completed action/proof state using non-sensitive sample content.
5. **Quizzes that match your work.** — Topic-relevant quiz screen.
6. **Projects at your level.** — Specific Easy, Medium, Hard, and Insane project ideas.
7. **See your progress add up.** — Progress screen with fictional test-account data.
8. **Your plan stays flexible.** — Settings or Plan screen showing reminders and appearance controls.

Capture with a clean status bar, no notifications, no real email address, no private proof, and no unsupported claim added as overlay text. Verify every visible feature works in the submitted build.

## Recorded owner/legal facts

The operator name, complete mailing address, launch jurisdiction, review contact and monitored inbox have already been supplied. The production app and website contain the configured public identity. Keep the exact private release values in ignored local configuration and provider settings. Do not request them again. Relevant configuration and declarations include:

- `EXPO_PUBLIC_OPERATOR_LEGAL_NAME`
- `EXPO_PUBLIC_OPERATOR_MAILING_ADDRESS`
- `EXPO_PUBLIC_LAUNCH_JURISDICTION`
- Copyright owner text for App Store Connect
- Monitored privacy/deletion contact confirmation
- Availability territories and price (current code baseline: free)
- EU Digital Services Act trader-status declaration if EU availability is added; the current saved launch is Canada only
- Any required tax, banking, or agreements information shown in App Store Connect

Never replace these with a brand name, guessed address, timezone-derived jurisdiction, or placeholder.

## Current release gates

Build 29 has finished, uploaded, processed as VALID and reached IN_BETA_TESTING internally. Its external state is READY_FOR_BETA_SUBMISSION. Build 27 remains the last verified public-beta and selected App Store build; external release, selection of 28 and updated listing/reviewer text must be completed when browser control returns. Do not create another binary merely to complete metadata or this checklist.

1. Production backend and website checks passed on November 27; see `../RELEASE_VERIFICATION_2026-11-27.md`. SMTP is the active email provider. The owner subsequently reported completing two-provider email testing, content-rights confirmation and operator MFA/backup work. These are owner attestations, not independently repeated tests.
2. Complete Apple's pending business-address 2FA correction. The previously entered code was rejected; no successful save is recorded.
3. Install TestFlight 1.0.0 (29) over the existing installation and complete the physical-iPhone upgrade, account, permission, notification, offline and accessibility checklist.
4. Validate the existing App Review credentials against the current app. Apple requires full reviewer access to account features; the guest path alone does not demonstrate that access.
5. Capture final Build 29 screenshots, retain honest provenance, and upload the required display-size set. Verify the content-rights declaration is saved in Apple after the owner's confirmation. Complete other required metadata truthfully; optional accessibility labels can be deferred.
6. Run `npm run appstore:preflight` plus `npm run appstore:submission:preflight`. Submit selected Build 29 only after the remaining gates pass.

Do not submit merely because the binary processed successfully.
