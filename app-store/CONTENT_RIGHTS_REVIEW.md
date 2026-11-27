# Content rights review

Reviewed November 27, 2026. This is a source and permission inventory, not a legal clearance or an owner declaration.

## Findings

- Mission resources in `src/services/missionPlanner.ts`, Learn, Action, and `spiritualResources.ts` open public HTTPS destinations using `Linking.openURL`. No third-party video player, scraped lesson pages, or downloaded course media was found in those flows. Labels identify the destination; Learn disclaims endorsement.
- Destinations include official documentation and education sources (GOV.UK, Google, OpenAI, React Native, Harvard CS50, YouTube, NASA JPL, CDC, California's barber board, MDN), ACE Fitness, and named religious text sites. An external link is not a blanket license to reproduce the destination's text, images, videos, or trademarks. Rights cannot be inferred from a website being public.
- ACE's published terms expressly grant a revocable hyperlink permission to its homepage, subject to presentation conditions. Changed the two exercise-library deep links and their labels to the homepage. No ACE logos or copied exercise descriptions were added. Source: https://www.acefitness.org/legal/terms-of-use/ . This source change is after Build 25 and is not yet in that installed binary.
- The root LICENSE contains Expo's MIT notice. Its redistribution notice must be retained. Third-party dependencies retain their own licenses; this review does not certify all transitive licenses.
- `app.json` uses `assets/images/rise-icon.png` and `assets/images/splash-icon.png`. The owner reported generating the artwork with ChatGPT on November 27. OpenAI's current Terms of Use assign its interest, if any, in output to the user to the extent permitted by law; the user remains responsible for inputs and third-party rights, and outputs may be similar to others' outputs. This supplies an output-use basis between OpenAI and the owner, not a trademark clearance or a guarantee of exclusivity. Source: https://openai.com/policies/terms-of-use/ . The original generation record/inputs were not examined. Expo/React starter images are also present; presence in the repository does not establish which assets are shipped or displayed in every route.
- RISE's locally authored mission/quiz/project templates are stored as source. No provenance records demonstrating the authorship of every passage were found. User proof is local media, and the app instructs users to submit only material they created or may use.

## Declaration status

Apple asks about apps that contain, show, or access third-party content, including whether the necessary rights are held or the use is otherwise permitted in each distribution territory. RISE accesses third-party resources, so selecting 'No' merely because links open externally would not resolve this question. Do not assert a worldwide legal basis from this limited code review.

Apple reference: https://developer.apple.com/help/app-store-connect/reference/app-information/app-and-compliance-information . Existing availability was observed as 175 countries/regions; no jurisdiction-wide clearance has been obtained.

Still needed: remaining destination/use review where necessary and the operator's informed factual declaration. No content-rights answer was submitted to Apple. Build 26 now delivers the ACE link change and newly configured native postal identity and is Testing in the public TestFlight group. The separately hosted website still needs its operator environment configuration published.
