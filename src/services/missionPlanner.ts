export type RiseProfile = {
  selectedGoals: string[];
  customGoal: string;
  weeklySkill?: string;
  focusSkills?: string[];
  skillStartDate?: string;
  currentSituation?: string;
  experience?: string;
  availableTime?: string;
  accountability?: string;
  commitment?: string;
  lastDifficultyFeedback?: "too_easy" | "right" | "too_hard";
  lastMissionUseful?: boolean;
  lastBlocker?: "time" | "instructions" | "tools" | "confidence" | "none";
  feedbackCount?: number;
  spiritualTradition?: string;
  trustedSources?: string;
  cycleBadges?: string[];
  planIdentityVersion?: 2;
};

export type PersonalizedMission = {
  id: string;
  day: number;
  title: string;
  description: string;
  steps: string[];
  skills: string[];
  duration: number;
  difficulty: "Starter" | "Stretch" | "Challenge";
  reward: number;
  coinReward: number;
  proof: string;
  skillId: string;
  goal: string;
  track: "career" | "life";
  focusSkill: string;
  resourceLabel: string;
  resourceUrl: string;
  guideLabel?: string;
  guideUrl?: string;
  mapQuery?: string;
  why: string;
  onePercent: string;
  successCriteria: string;
  coachTip?: string;
  ifStuck?: string;
  reflectionPrompt?: string;
  safetyNote?: string;
  sourceNote?: string;
  resourceNote?: string;
};

export function parseMissionPayload(raw?: string): PersonalizedMission | null {
  if (!raw || raw.length > 50_000) return null;
  try {
    const candidate = JSON.parse(raw);
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return null;
    if (!["career", "life"].includes(candidate.track) || !["Starter", "Stretch", "Challenge"].includes(candidate.difficulty)) return null;
    if (![candidate.steps, candidate.skills].every(value => Array.isArray(value) && value.length > 0 && value.length <= 20 && value.every(item => typeof item === "string" && item.length > 0 && item.length <= 3000))) return null;
    if (!["id", "title", "description", "goal", "skillId", "focusSkill", "resourceUrl", "successCriteria", "why", "onePercent", "proof", "resourceLabel"].every(key => typeof candidate[key] === "string" && candidate[key].length > 0)) return null;
    if (!["guideLabel", "guideUrl", "coachTip", "ifStuck", "safetyNote", "sourceNote", "resourceNote", "mapQuery", "reflectionPrompt"].every(key => candidate[key] === undefined || typeof candidate[key] === "string")) return null;
    if (!Number.isInteger(candidate.day) || candidate.day < 1 || candidate.day > 30) return null;
    if (!["duration", "reward", "coinReward"].every(key => Number.isFinite(candidate[key]) && candidate[key] >= 0 && candidate[key] <= 1440)) return null;
    if (new URL(candidate.resourceUrl).protocol !== "https:" || (candidate.guideUrl && new URL(candidate.guideUrl).protocol !== "https:")) return null;
    return candidate as PersonalizedMission;
  } catch {
    return null;
  }
}

export const fallbackProfile: RiseProfile = {
  selectedGoals: ["personal"],
  customGoal: "build a useful skill and become 1% better every day",
  weeklySkill: "Foundations",
  focusSkills: ["Foundations", "Focused Practice", "Feedback"],
  skillStartDate: new Date().toISOString(),
  experience: "Complete beginner",
  availableTime: "30–60 minutes",
  commitment: "Every 7 days",
};

const skillRecommendations: Record<string, string[]> = {
  "software-engineer": ["React Native", "TypeScript", "APIs", "Debugging", "Git & GitHub", "Algorithms"],
  "ai-engineer": ["Python", "Machine Learning", "Prompt Engineering", "Data", "APIs", "Model Evaluation"],
  "aerospace-engineer": ["Aerodynamics", "CAD", "Physics", "Calculus", "Programming", "Engineering Design"],
  entrepreneur: ["Sales", "Customer Research", "Product Validation", "Marketing", "Negotiation", "Financial Literacy"],
  youtube: ["Storytelling", "Hooks", "Thumbnail Design", "Scripting", "Editing", "Audience Retention"],
  "content-creator": ["Storytelling", "Short-form Video", "Editing", "Branding", "Writing", "Analytics"],
  barbering: ["Fades", "Lineups", "Blending", "Clipper Control", "Consultations", "Customer Experience"],
  athlete: ["Strength", "Mobility", "Recovery", "Nutrition", "Technique", "Mental Performance"],
  fitness: ["Strength Basics", "Cardio", "Mobility", "Recovery", "Safe Form", "Consistency"],
  basketball: ["Ball Handling", "Shooting Form", "Footwork", "Conditioning", "Defense", "Game Awareness"],
  mobility: ["Joint Control", "Warm-ups", "Flexibility", "Recovery", "Posture", "Movement Quality"],
  nutrition: ["Balanced Meals", "Food Literacy", "Hydration", "Meal Planning", "Recovery Nutrition", "Consistency"],
  wellbeing: ["Sleep Routine", "Stress Skills", "Movement", "Reflection", "Healthy Boundaries", "Consistency"],
  personal: ["Focus", "Communication", "Confidence", "Time Management", "Reflection", "Habit Design"],
  student: ["Active Recall", "Focus", "Note Taking", "Exam Practice", "Time Management", "Research"],
  "graphic-design": ["Visual Hierarchy", "Typography", "Color", "Layout", "Design Critique", "Portfolio"],
  photography: ["Composition", "Lighting", "Exposure", "Editing", "Storytelling", "Portfolio"],
  music: ["Technique", "Rhythm", "Ear Training", "Theory", "Performance", "Recording"],
  medicine: ["Study Skills", "Scientific Literacy", "Communication", "Ethics", "Research", "Clinical Awareness"],
  law: ["Legal Research", "Issue Spotting", "Writing", "Argument", "Source Checking", "Ethics"],
  finance: ["Financial Literacy", "Spreadsheets", "Research", "Risk", "Communication", "Ethics"],
  marketing: ["Customer Research", "Positioning", "Copywriting", "Content", "Analytics", "Experiments"],
  engineering: ["Engineering Design", "CAD", "Systems Thinking", "Prototyping", "Testing", "Problem Solving"],
  spirituality: ["Foundational Texts", "Prayer or Meditation", "Reflection & Journaling", "Community & Service", "Ethical Practice", "Questions & Understanding"],
};

export function getRecommendedSkills(goal: string, customGoal = ""): string[] {
  if (/^custom-|^personal$/.test(goal) && customGoal.trim()) {
    const template = resolveTemplate("", customGoal);
    if (template !== genericTemplate) return [...template.skills];
    return ["Goal-specific practice", "Technique", "Performance review"];
  }
  return skillRecommendations[goal] || [
    "Foundations",
    "Focused Practice",
    "Communication",
    "Problem Solving",
    "Real Projects",
    "Feedback",
  ];
}

export function minutesForTime(value?: string): number {
  const normalized = (value || "").toLowerCase();
  if (normalized.includes("15")) return 15;
  if (normalized.includes("30") && !normalized.includes("60")) return 30;
  if (normalized.includes("60")) return 60;
  if (normalized.includes("90")) return 90;
  return 30;
}

type MissionTemplate = {
  titles: string[];
  actions: string[];
  skills: string[];
  search: string;
  mapQuery?: string;
};

const templates: Record<string, MissionTemplate> = {
  beyblade: {
    titles: ["Measure your launch consistency", "Control your launch angle", "Compare two launch strengths", "Test one matchup", "Practice a repeatable battle routine", "Review your weakest matchup", "Retest your launch baseline"],
    actions: [
      "Use an intact Beyblade, compatible launcher, and enclosed stadium. Make ten launches with the same setup. Log spin time and whether each launch stays in the stadium; calculate your average and successful launches out of ten.",
      "Keep your Beyblade and launch strength the same. Compare five level launches with five slightly angled launches in an enclosed stadium. Record stability and spin time, then choose the more consistent angle.",
      "Keep your setup and angle fixed. Compare five gentle launches with five firmer launches within the manufacturer's instructions. Record spin time and stadium exits; choose control over force.",
      "With permission and a practice partner, run five battles with the same two legal setups. Record wins, losses, and finish types. If no partner is available, compare five solo launches with your baseline instead.",
      "Write a short routine for checking equipment, stance, grip, and launch angle. Follow it for ten launches, logging successful launches and one repeatable mistake.",
      "Review your battle or solo-launch log. Choose one recurring problem, change only one permitted variable, and repeat five trials under the same conditions.",
      "Repeat the first day's ten-launch test using the same equipment and conditions. Compare average spin time and successful launches, then choose the next measurable practice target.",
    ],
    skills: ["Launch control", "Matchup testing", "Battle review"],
    search: "Beyblade launch technique stadium safety beginner",
  },
  "ai-engineering": {
    titles: [
      "Define one useful AI workflow",
      "Build a reliable prompt and rubric",
      "Use Codex or Claude Code on a small task",
      "Connect one model through an API",
      "Evaluate five real outputs",
      "Add safety and failure handling",
      "Ship and explain a working AI demo",
    ],
    actions: [
      "Choose one real user problem, define the input and useful output, and name one result you can measure.",
      "Write a prompt with context, constraints, an example, and a scoring rubric. Test it on three different inputs.",
      "Use Codex or Claude Code to plan, implement, and review one small feature. Verify every generated change before keeping it.",
      "Call one model from a small typed function, keep credentials server-side, and show a helpful loading and error state.",
      "Create five representative test cases, score accuracy and usefulness with the same rubric, and record the weakest case.",
      "Add input limits, privacy-safe logging, refusal handling, and a fallback for an unavailable or low-confidence result.",
      "Run the full workflow, capture a short demo, and explain the user problem, evidence, limitation, and next improvement.",
    ],
    skills: ["AI product engineering", "Model evaluation", "Safe deployment"],
    search: "official Codex Claude Code AI engineering tutorial model evaluation",
  },
  hooks: {
    titles: ["Learn four hook patterns", "Write 10 hooks", "Score hooks against real videos", "Build a script around the winner", "Record three openings", "Edit for immediate value", "Publish and review retention"],
    actions: ["Study curiosity, problem, surprise, and proof-based hooks. Write one example of each.", "Choose one video idea and write ten different opening hooks, then select your strongest.", "Compare your top three hooks with successful videos in the same niche and improve specificity.", "Write a short script whose first 30 seconds delivers on your winning hook.", "Record the opening three ways and choose the clearest, most natural delivery.", "Remove every pause or sentence that delays the promised value.", "Publish or privately upload, then record the early-retention result and one change for next time."],
    skills: ["Hooks", "Audience retention", "Scripting"],
    search: "YouTube hooks audience retention examples",
  },
  thumbnails: {
    titles: ["Learn visual hierarchy", "Study winning thumbnails", "Create 3 thumbnail concepts", "Pair concepts with titles", "Test at small size", "Polish the winner", "Publish and review clicks"],
    actions: ["Study contrast, one clear subject, readable scale, and a single visual promise.", "Collect three successful examples in your niche and name the promise each makes.", "Create three meaningfully different thumbnail concepts for one video idea.", "Write two matching titles for each concept without repeating the same words.", "Shrink each concept to phone size and ask one person what they notice first.", "Improve the strongest concept using the feedback and remove unnecessary elements.", "Publish or save the final pair, then record click-through data or a prediction to test."],
    skills: ["Thumbnail Design", "Visual hierarchy", "Packaging"],
    search: "YouTube Creator Academy thumbnail design click through rate",
  },
  fades: {
    titles: ["Map a clean fade", "Control one transition", "Remove one guideline", "Blend the weight line", "Refine the lineup", "Finish a client-ready fade", "Compare and correct"],
    actions: ["Choose the fade height and mark every guard transition before cutting.", "Practice a controlled scooping motion on the 0 to 0.5 transition.", "Use corner work and small lever changes to remove one visible guideline.", "Work one dark weight line without raising the fade or creating a new line.", "Create a balanced, natural lineup without pushing the hairline back.", "Complete detail work, styling, sanitation, and a clear client aftercare tip.", "Compare before and after photos, mark the weakest transition, and correct it once."],
    skills: ["Fades", "Clipper control", "Blending"],
    search: "professional barber fade guideline blending tutorial",
    mapQuery: "barber supply stores and barber schools near me",
  },
  "react-native": {
    titles: ["Build one reusable component", "Add typed states", "Create a useful screen", "Handle loading and errors", "Test the interaction", "Polish accessibility", "Ship a working demo"],
    actions: ["Create a React Native component with at least two typed props and use it twice.", "Add two visible states with TypeScript types and predictable styling.", "Compose the component into one screen that solves a small user problem.", "Add loading, empty, and error feedback without breaking the main flow.", "Test every pressable state and one edge case, then fix the biggest failure.", "Add readable labels, touch targets, contrast, and screen-reader meaning.", "Run the app, capture a working demo, and document one improvement for version two."],
    skills: ["React Native", "TypeScript", "Product engineering"],
    search: "site:reactnative.dev docs components accessibility TypeScript",
  },
  "customer-research": {
    titles: [
      "Draft three customer interview questions",
      "Test your interview guide",
      "Run one consent-based interview",
      "Separate observations from assumptions",
      "Group repeated customer problems",
      "Choose one problem to investigate",
      "Share an evidence-based research summary",
    ],
    actions: [
      "Choose one audience problem and draft three open-ended interview questions about a recent real experience, the current workaround, and the desired outcome.",
      "Read each question aloud, remove leading language, and ask a practice partner what felt unclear.",
      "With informed consent, ask one participant the questions and record concise notes without collecting unnecessary personal information.",
      "Mark each note as a direct observation, participant statement, or your own assumption.",
      "Compare the notes and group repeated problems, workarounds, and desired outcomes without claiming that one interview represents everyone.",
      "Choose one problem supported by the clearest evidence and write what you still need to learn.",
      "Create a one-page summary with the audience, evidence, limitations, and next research question.",
    ],
    skills: ["Customer Research", "Interviewing", "Evidence synthesis"],
    search: "customer research user interview open ended questions beginner",
  },
  youtube: {
    titles: [
      "Define your viewer promise",
      "Study 3 winning videos",
      "Write 10 clickable ideas",
      "Script a strong first 30 seconds",
      "Record a useful short",
      "Edit for retention",
      "Publish and review the data",
    ],
    actions: [
      "Write one sentence naming your viewer, their problem, and the result your channel delivers.",
      "Compare three videos in your niche. Note the title pattern, thumbnail promise, hook, and payoff.",
      "Create ten titles that solve a specific viewer problem. Rank the best three by usefulness and curiosity.",
      "Write and speak a hook that proves value immediately, then remove every unnecessary sentence.",
      "Record one short video that teaches one concrete idea from your goal.",
      "Cut pauses, add clear captions, and make every five seconds earn the next five.",
      "Publish or privately upload the video. Record one metric and one change for your next upload.",
    ],
    skills: ["Audience research", "Storytelling", "On-camera delivery"],
    search: "YouTube Creator Academy audience retention thumbnails",
  },
  barbering: {
    titles: [
      "Build your consultation checklist",
      "Map a clean fade",
      "Practice clipper control",
      "Refine the blend",
      "Sharpen the lineup",
      "Create a client-ready finish",
      "Review your before and after",
    ],
    actions: [
      "Write five questions that uncover the client's style, maintenance needs, hair pattern, and boundaries.",
      "On a mannequin, model, or diagram, mark the baseline and each guard transition before cutting.",
      "Practice consistent scooping motion on one controlled section and photograph the result.",
      "Use corner work and controlled guard changes to remove one visible weight line.",
      "Plan and execute a symmetrical hairline without pushing it back.",
      "Finish one look with detail work, styling, sanitation, and a clear home-care recommendation.",
      "Compare before and after images. Identify one strength and the single highest-value correction.",
    ],
    skills: ["Consultation", "Fading", "Detail work"],
    search: "professional barber fade fundamentals consultation tutorial",
    mapQuery: "barber schools and barber supply stores near me",
  },
  engineering: {
    titles: [
      "Define the real constraint",
      "Research existing solutions",
      "Sketch three concepts",
      "Choose with evidence",
      "Build a rough prototype",
      "Run one measurable test",
      "Improve the weakest point",
    ],
    actions: [
      "Turn your goal into a problem statement with a user, need, measurable outcome, and constraint.",
      "Find three existing approaches and record one strength, failure mode, and transferable idea from each.",
      "Sketch three meaningfully different solutions and label inputs, outputs, materials, and risks.",
      "Score each concept for impact, feasibility, cost, and safety. Select one and explain the trade-off.",
      "Build the smallest physical, CAD, code, or paper prototype that tests the core assumption.",
      "Choose one metric, run a repeatable test, and record the result without changing conditions mid-test.",
      "Use your evidence to change one design variable, retest it, and explain whether it improved.",
    ],
    skills: ["Systems thinking", "Prototyping", "Testing"],
    search: "engineering design process prototype testing fundamentals",
    mapQuery: "makerspaces and engineering workshops near me",
  },
  coding: {
    titles: [
      "Define one user problem",
      "Plan the smallest solution",
      "Build the core flow",
      "Handle the failure case",
      "Ask a real user to test",
      "Fix the biggest friction",
      "Ship version one",
    ],
    actions: [
      "Name one real person, one repeated problem, and what success looks like for them.",
      "Write the minimum inputs, outputs, and three-step user flow. Remove anything not needed this week.",
      "Implement the smallest working path from input to useful output.",
      "Add validation and a helpful message for the most likely error.",
      "Give the tool to one person. Watch silently and record where they hesitate.",
      "Fix the one issue that most blocks the result, then test the flow again.",
      "Deploy or record a working demo, write what changed, and choose the next measurable improvement.",
    ],
    skills: ["Product thinking", "Programming", "Testing"],
    search: "software project tutorial user testing deployment",
  },
  spirituality: {
    titles: [
      "Define what spiritual growth means to you",
      "Read one short primary passage",
      "Practice stillness and reflection",
      "Ask one honest question",
      "Turn one value into service",
      "Learn with a trusted community",
      "Review what changed in you",
    ],
    actions: [
      "Write what becoming closer to your faith, values, or sense of meaning would look like in daily behavior.",
      "Read a short passage from a primary text or book you personally trust. Record its context and one idea without forcing a conclusion.",
      "Spend a short, distraction-free period in prayer, meditation, contemplation, or journaling that fits your tradition.",
      "Write one sincere question. Compare a primary source with guidance from a trusted, qualified teacher or community leader.",
      "Choose one value such as compassion, honesty, gratitude, patience, or service and practice it through one concrete action.",
      "Attend, contact, or learn from a community you trust. Ask how they verify teachings and handle disagreement.",
      "Review your notes without judging yourself. Name one belief, habit, or question that became clearer and one next step.",
    ],
    skills: ["Primary-source study", "Reflection", "Community and service"],
    search: "primary text beginner explanation spiritual practice context",
    mapQuery: "faith and spiritual communities near me",
  },
};

const genericTemplate: MissionTemplate = {
  titles: [
    "Define your 1% target",
    "Copy one proven move",
    "Practice the smallest skill",
    "Get real feedback",
    "Apply it in the real world",
    "Fix the weakest part",
    "Prove your improvement",
  ],
  actions: [
    "Turn your goal into one observable result you can improve this week.",
    "Open the RISE resource below. Copy one useful technique for 10 minutes, then write one sentence about what improved.",
    "Practice the smallest repeatable part of the skill with full attention.",
    "Show your work to one relevant person and ask what would make it more useful.",
    "Use the skill to create a real result for yourself or another person.",
    "Review your evidence and improve the single weakest part.",
    "Create a before-and-after comparison and choose your next 1% improvement.",
  ],
  skills: ["Focused practice", "Feedback", "Execution"],
  search: "beginner practical tutorial deliberate practice",
};

// Each offered direction has a concrete practice task. Unrecognized goals use
// the member's own focus instead of being misrepresented as a coding plan.
const practiceDomains: Record<string, { task: string; metric: string; skills: string[] }> = {
  fitness: { task: "Practice five slow chair sit-to-stands using a stable chair, only within a comfortable pain-free range", metric: "comfortable repetitions and control", skills: ["Safe Form", "Strength Basics", "Consistency"] },
  athlete: { task: "Walk for five comfortable minutes and practise five slow, supported bodyweight squats within a pain-free range", metric: "comfortable repetitions and movement control", skills: ["Technique", "Mobility", "Recovery"] },
  basketball: { task: "In a clear practice area, dribble for 30 seconds with each hand without looking down", metric: "controlled bounces and lost dribbles", skills: ["Ball Handling", "Footwork", "Game Awareness"] },
  mobility: { task: "Seated in a stable chair, gently raise and lower each heel ten times without forcing your range", metric: "comfortable repetitions and differences between sides", skills: ["Joint Control", "Movement Quality", "Recovery"] },
  nutrition: { task: "Use a sample meal to identify its vegetables or fruit, protein source, and grain or other starchy food", metric: "food groups identified and one practical addition", skills: ["Food Literacy", "Balanced Meals", "Meal Planning"] },
  wellbeing: { task: "Choose a realistic bedtime and write a three-step wind-down routine you can try tonight", metric: "steps followed and a brief next-morning observation", skills: ["Sleep Routine", "Reflection", "Consistency"] },
  student: { task: "Read a short section of your study material, close it, and answer five recall questions from memory before checking the source", metric: "correct answers out of five and misconceptions corrected", skills: ["Active Recall", "Exam Practice", "Note Taking"] },
  "graphic-design": { task: "Create a simple event poster with one headline, a date, and a location using no more than two typefaces", metric: "whether a viewer can identify the event, date, and location in five seconds", skills: ["Visual Hierarchy", "Typography", "Layout"] },
  photography: { task: "Photograph one still object three ways using a different composition each time and the same lighting", metric: "three saved compositions and the clearest focal point", skills: ["Composition", "Lighting", "Storytelling"] },
  music: { task: "Choose a short, comfortable passage or rhythm and perform it three times at a slow, steady tempo", metric: "accurate notes or beats out of the passage total", skills: ["Technique", "Rhythm", "Performance"] },
  finance: { task: "Use fictional numbers to build a monthly spending plan with income, essential costs, optional spending, and savings", metric: "whether the plan balances without missing expenses", skills: ["Financial Literacy", "Spreadsheets", "Risk"] },
  entrepreneur: { task: "Describe one customer, their recent problem, their current workaround, and three neutral questions to test your assumptions", metric: "assumptions clearly separated from customer evidence", skills: ["Customer Research", "Product Validation", "Sales"] },
  marketing: { task: "Write three versions of a short message for one audience, each naming the same concrete benefit and next action", metric: "whether a reader can repeat the benefit and next action", skills: ["Positioning", "Copywriting", "Experiments"] },
  law: { task: "Read a short public case summary from an official court source in your jurisdiction and separately note the facts, issue, decision, and reasoning", metric: "four labelled sections with a source and date", skills: ["Legal Research", "Issue Spotting", "Source Checking"] },
  medicine: { task: "Read one public educational page from an official health institution and make five study questions with answers cited to that page", metric: "five source-backed study answers without diagnosing a real person", skills: ["Scientific Literacy", "Study Skills", "Ethics"] },
};

function domainTemplate(domain: typeof practiceDomains[string]): MissionTemplate {
  const focus = domain.skills[0];
  return {
    titles: [`Measure your ${focus} baseline`, `Study a ${focus} example`, `Repeat your ${focus} practice`, `Get feedback on ${focus}`, `Apply your ${focus} practice`, `Correct one ${focus} mistake`, `Retest your ${focus} baseline`],
    actions: [
      `${domain.task}. Record ${domain.metric}. Save this as your baseline.`,
      `Study one reliable worked example of today's task. ${domain.task}. Compare your result with the example and note one difference.`,
      `${domain.task}. Repeat the task under the same conditions and record ${domain.metric}.`,
      `${domain.task}. Ask a trusted, willing person for one specific observation, or compare with a reliable worked example if nobody is available.`,
      `${domain.task}. Apply the correction from your last session and record ${domain.metric}.`,
      `Review your saved work, choose one recurring mistake, and change just one variable. ${domain.task}. Record whether the change helped.`,
      `${domain.task}. Compare ${domain.metric} with your first session under the same conditions. Record one improvement and your next practice target.`,
    ],
    skills: domain.skills,
    search: `${focus} beginner worked example practice`,
  };
}

const domainTemplates = Object.fromEntries(Object.entries(practiceDomains).map(([key, domain]) => [key, domainTemplate(domain)]));
const domainAliases: [string, RegExp][] = [
  ["basketball", /\bbasketball\b/], ["photography", /\bphotograph(?:y|er|s)?\b/],
  ["music", /\bmusic(?:ian)?\b|\bpiano\b|\bguitar\b|\bdrum(?:s|ming)?\b/],
  ["graphic-design", /graphic design|typography|visual hierarchy/], ["finance", /financial literacy|budget(?:ing)?|spending plan/],
  ["marketing", /\bmarketing\b|\bcopywriting\b/], ["entrepreneur", /\bentrepreneur\b|start a business/],
  ["nutrition", /\bnutrition\b|balanced meals/], ["mobility", /\bmobility\b|\bflexibility\b/],
  ["fitness", /\bfitness\b|strength training/], ["wellbeing", /sleep routine|wind.down|\bwellbeing\b/],
  ["medicine", /\bmedicine\b|\bmedical student\b/], ["law", /\blawyer\b|\blegal research\b|\blaw school\b/],
];

function resolveTemplate(goal: string, customGoal: string): MissionTemplate {
  const combined = `${goal} ${customGoal}`.toLowerCase();
  if (/\bbeyblad(?:e\w*|ing)\b/i.test(combined)) return templates.beyblade;
  if (domainTemplates[goal]) return domainTemplates[goal];
  const customDomain = domainAliases.find(([, pattern]) => pattern.test(combined));
  if (customDomain) return domainTemplates[customDomain[0]];
  if (/customer research|user research|customer interview|user interview/.test(combined)) return templates["customer-research"];
  if (/\b(?:spiritual(?:ity)?|faith|religion|god|prayer|scripture)\b/.test(combined)) return templates.spirituality;
  if (/\bai\b|artificial intelligence|machine learning|prompt engineering|model evaluation|codex|claude code/.test(combined)) return templates["ai-engineering"];
  if (/react native/.test(combined)) return templates["react-native"];
  if (/thumbnail/.test(combined)) return templates.thumbnails;
  if (/\bhooks?\b/.test(combined) && /youtube|creator|video|audience|storytelling/.test(combined)) return templates.hooks;
  if (/\bfades?\b|blending|clipper/.test(combined)) return templates.fades;
  if (/\bcod(?:e|ing)\b|\bsoftware\b|\bdeveloper\b|\bprogramming\b|\bcomputer program\b/.test(combined)) return templates.coding;
  if (/youtube|creator|video edit|video production|channel/.test(combined)) return templates.youtube;
  if (/\b(?:barber(?:ing)?|haircut|fade|hair)\b/.test(combined)) return templates.barbering;
  if (/engineer|engineering|mechanical|electrical|civil|prototype/.test(combined)) return templates.engineering;
  if (/\bstud(?:y|ent|ying)\b|\bexam\b/.test(combined)) return domainTemplates.student;
  return genericTemplate;
}

function safetyNoteFor(goal: string): string {
  const value = goal.toLowerCase();
  if (/beyblad/.test(value)) return "Use compatible, undamaged equipment and an enclosed stadium according to the manufacturer's instructions. Keep faces and hands away until all tops stop. Never launch toward people or animals or use modified metal parts.";
  if (/athlete|fitness|sport|basketball/.test(value)) return "Use safe form, suitable equipment, and a clear practice area. Stop if you feel pain, dizziness, or unusual discomfort.";
  if (/barber|hair/.test(value)) return "Sanitize tools, get the model or client's permission, protect skin and eyes, and do not attempt chemical or medical procedures without qualified supervision.";
  if (/medicine|health/.test(value)) return "Use this only for education. Do not diagnose, treat, or change medication; use qualified medical guidance for personal decisions.";
  if (/finance/.test(value)) return "Practice with examples or simulated numbers. This mission is educational and is not personalized investment, tax, or financial advice.";
  if (/law/.test(value)) return "Use this for general learning only. Laws vary by location; do not treat the mission as legal advice for a real case.";
  if (/engineer|aerospace/.test(value)) return "Prototype at low risk. Do not test mains electricity, pressure systems, vehicles, flight hardware, or structural loads without qualified supervision.";
  return "Protect private information, use work you created or have permission to use, and stop or simplify any step that feels unsafe.";
}

function trustedResources(goal: string, template: MissionTemplate, title: string, focusSkill: string, level: string) {
  const value = goal.toLowerCase();
  if (template === templates.beyblade) return { video: template.search, guideLabel: undefined, guideUrl: undefined };
  if (template === genericTemplate) return { video: genericTemplate.search, guideLabel: undefined, guideUrl: undefined };
  const publicSkills = [...Object.values(skillRecommendations).flat(), ...template.skills];
  const publicFocus = publicSkills.some((skill) => skill.toLowerCase() === focusSkill.toLowerCase()) ? focusSkill : template.skills[0];
  const searchContext = `${publicFocus} ${title} ${level.includes("advanced") ? "advanced" : "beginner"}`;
  if (template === templates["customer-research"]) {
    return { video: `${searchContext} open ended customer interview questions user research`, guideLabel: "GOV.UK guide to in-depth user interviews", guideUrl: "https://www.gov.uk/service-manual/user-research/using-in-depth-interviews" };
  }
  if (/\bai\b|machine-learning|prompt|model-evaluation/.test(value) || template === templates["ai-engineering"]) {
    const usesCodingAgent = /codex|claude|code|build|ship|api/i.test(title);
    return usesCodingAgent
      ? { video: `OpenAI Codex Anthropic Claude Code official ${searchContext} full tutorial`, guideLabel: "Official Codex documentation", guideUrl: "https://learn.chatgpt.com/docs" }
      : { video: `Google machine learning official ${searchContext} full lesson`, guideLabel: "Google Machine Learning Crash Course", guideUrl: "https://developers.google.com/machine-learning/crash-course/" };
  }
  if (/software|code|developer|program/.test(value) || template === templates["react-native"] || template === templates.coding) {
    return template === templates["react-native"] || /react native/i.test(publicFocus)
      ? { video: `React Native official ${searchContext} tutorial`, guideLabel: "React Native official guide", guideUrl: "https://reactnative.dev/docs/getting-started" }
      : { video: `Harvard CS50 ${searchContext} programming`, guideLabel: "Harvard CS50 programming course", guideUrl: "https://cs50.harvard.edu/x/" };
  }
  if (/youtube|creator|video/.test(value) || template === templates.youtube || template === templates.hooks || template === templates.thumbnails) {
    return { video: `YouTube Creators official ${searchContext}`, guideLabel: "YouTube official creator guidance", guideUrl: "https://support.google.com/youtube/answer/16559650?hl=en" };
  }
  if (/engineer|aerospace/.test(value) || template === templates.engineering) {
    return { video: `NASA engineering design process ${searchContext}`, guideLabel: "NASA engineering design process", guideUrl: "https://www.jpl.nasa.gov/edu/resources/image/engineering-design-process-flow-chart/" };
  }
  if (/fitness|athlete|basketball|mobility|wellbeing|nutrition/.test(value)) {
    return /nutrition/.test(value)
      ? { video: `CDC healthy eating ${searchContext}`, guideLabel: "CDC healthy eating guidance", guideUrl: "https://www.cdc.gov/nutrition/features/healthy-eating-tips.html" }
      : { video: `ACE Fitness official ${searchContext}`, guideLabel: "ACE Fitness resources", guideUrl: "https://www.acefitness.org/" };
  }
  if (/barber|hair/.test(value) || template === templates.barbering || template === templates.fades) {
    return { video: `MiladyPro barber education ${searchContext}`, guideLabel: "Official barber health and safety guide", guideUrl: "https://www.barbercosmo.ca.gov/schools/healthsafety_course.shtml" };
  }
  if (/spiritual|faith/.test(value) || template === templates.spirituality) {
    return { video: `${searchContext} primary source qualified teacher full lesson`, guideLabel: "Use your trusted primary source", guideUrl: undefined };
  }
  return { video: `${searchContext} practical tutorial`, guideLabel: undefined, guideUrl: undefined };
}

const CAREER_GOALS = new Set([
  "software-engineer", "ai-engineer", "aerospace-engineer", "entrepreneur", "youtube",
  "content-creator", "barbering", "graphic-design", "photography", "music", "student",
  "medicine", "law", "finance", "marketing", "engineering", "custom-career",
]);

export function goalTrack(goal: string): "career" | "life" {
  return CAREER_GOALS.has(goal) ? "career" : "life";
}

function interleaveGoals(careerGoals: string[], lifeGoals: string[]): string[] {
  if (!careerGoals.length) return lifeGoals;
  if (!lifeGoals.length) return careerGoals;
  const balanced: string[] = [];
  const length = Math.max(careerGoals.length, lifeGoals.length);
  for (let index = 0; index < length; index += 1) {
    balanced.push(careerGoals[index % careerGoals.length]);
    balanced.push(lifeGoals[index % lifeGoals.length]);
  }
  return balanced;
}

function shortStableKey(values: string[]): string {
  let hash = 2166136261;
  for (const character of values.join("|")) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function createSevenDayPlan(profile: RiseProfile): PersonalizedMission[] {
  const selectedGoals = profile.selectedGoals.length
    ? profile.selectedGoals.slice(0, 64)
    : ["personal"];
  const goal = selectedGoals[0];
  const customGoal = profile.customGoal || fallbackProfile.customGoal;
  const weeklySkill = profile.weeklySkill || "Foundations";
  const focusSkills = profile.focusSkills?.length ? profile.focusSkills.slice(0, 3) : [weeklySkill];
  const duration = minutesForTime(profile.availableTime);
  const level = (profile.experience || "beginner").toLowerCase();
  const cycle = (profile.commitment || "Every 7 days").toLowerCase();
  const cycleLength = cycle.includes("10")
    ? 10
    : cycle.includes("30") || cycle.includes("month")
      ? 30
      : 7;
  const skillSlug = weeklySkill.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const planKey = shortStableKey(profile.planIdentityVersion === 2 && selectedGoals.some((item) => item.startsWith("custom-"))
    ? [...selectedGoals, customGoal, ...focusSkills] : selectedGoals);
  const cycleKey = (profile.skillStartDate || "current").slice(0, 10);
  const adaptation = profile.lastDifficultyFeedback;
  const adaptiveDuration = profile.lastBlocker === "time"
    ? Math.min(10, duration)
    : adaptation === "too_hard"
    ? Math.max(10, Math.round(duration * 0.7))
    : adaptation === "too_easy"
      ? Math.min(90, Math.round(duration * 1.15))
      : duration;

  const careerGoals = selectedGoals.filter((selectedGoal) => goalTrack(selectedGoal) === "career");
  const lifeGoals = selectedGoals.filter((selectedGoal) => goalTrack(selectedGoal) === "life");
  const balancedGoals = interleaveGoals(careerGoals, lifeGoals);

  return Array.from({ length: cycleLength }, (_, index) => {
    const day = index + 1;
    const missionGoal = balancedGoals[index % balancedGoals.length] || goal;
    const track = goalTrack(missionGoal);
    // Keep each selected direction distinct. A faith-related custom goal must
    // not turn the separate career days into spiritual missions (or vice versa).
    const goalParts = customGoal.split(" + ");
    const goalContext = goalParts.length === selectedGoals.length
      ? goalParts[selectedGoals.indexOf(missionGoal)] : selectedGoals.length === 1 ? customGoal : "";
    const isCustom = missionGoal.startsWith("custom-") || missionGoal === "personal";
    const recommendedSkills = getRecommendedSkills(missionGoal, isCustom ? goalContext : "");
    const matchingFocusSkill = focusSkills.find((focusSkill) =>
      recommendedSkills.some((recommended) => recommended.toLowerCase() === focusSkill.toLowerCase())
    );
    const missionFocusSkill = matchingFocusSkill || (selectedGoals.length === 1 ? focusSkills[index % focusSkills.length] : undefined) || recommendedSkills[index % recommendedSkills.length] || weeklySkill;
    const template = resolveTemplate(missionGoal, `${missionFocusSkill} ${isCustom ? goalContext : ""}`);
    const goalDay = Array.from({ length: index }, (_, previous) => balancedGoals[previous % balancedGoals.length]).filter((item) => item === missionGoal).length;
    const templateIndex = goalDay % template.titles.length;
    const round = Math.floor(goalDay / template.titles.length) + 1;
    const baseTitle = template === genericTemplate
      ? [ `Measure your ${missionFocusSkill} baseline`, `Study one ${missionFocusSkill} technique`, `Repeat your ${missionFocusSkill} drill`, `Get feedback on ${missionFocusSkill}`, `Apply ${missionFocusSkill} in practice`, `Correct one ${missionFocusSkill} mistake`, `Retest your ${missionFocusSkill} baseline` ][templateIndex]
      : template.titles[templateIndex];
    const title = `${round > 1 ? `Level ${round}: ` : ""}${baseTitle}`;
    const resources = trustedResources(missionGoal, template, title, missionFocusSkill, level);
    const difficulty: PersonalizedMission["difficulty"] = adaptation === "too_easy"
      ? (day <= 2 ? "Stretch" : "Challenge")
      : adaptation === "too_hard"
        ? (day <= 5 ? "Starter" : "Stretch")
        : (day <= 2 ? "Starter" : day <= 5 ? "Stretch" : "Challenge");
    const personalizedContext = profile.currentSituation?.trim()
      ? ` Starting from: ${profile.currentSituation.trim()}`
      : "";
    // External video searches must not disclose a member's private goal,
    // experience, faith preference, or trusted-source words to YouTube.
    const query = encodeURIComponent(resources.video);
    const isSpiritual = template === templates.spirituality;
    const isBeyblade = template === templates.beyblade;
    const isFirstCustomerResearchMission = template === templates["customer-research"] && templateIndex === 0;
    const baseSteps = isFirstCustomerResearchMission
      ? [
          "Choose one audience and problem, then draft three neutral, open-ended questions about a recent experience, current workaround, and desired outcome.",
          "Read the questions aloud, remove leading or private wording, and save a clearly labelled final draft.",
        ]
      : [
          template === genericTemplate
            ? `Work toward “${goalContext || customGoal}” through ${missionFocusSkill}. ${template.actions[templateIndex]} Record the drill, number of attempts, and one observable result so you can compare the next session.`
            : template.actions[templateIndex],
          "Review the result against today’s success criteria, improve the weakest part once, and save the final version.",
        ];

    if (round > 1) {
      baseSteps[0] += ` Use your saved result from round ${round - 1} as the baseline. Choose one safe quality constraint, such as accuracy or consistency, and keep the other conditions comparable.`;
      baseSteps[1] = "Compare this attempt with your earlier result. Record the constraint, what improved or regressed, and one correction for the next round.";
    }
    const adjustment = profile.lastBlocker;
    const steps = adjustment === "tools"
      ? [
          `Prepare a safe alternative for “${title}”: use a paper sketch, a dry run, or a worked example to practise ${missionFocusSkill} without the missing equipment. Do not imitate hazardous equipment or claim you performed the real task.`,
          "Save the preparation, name the missing tool, and record the exact step you will test when it is available.",
        ]
      : adjustment === "time"
        ? [`Set a ${adaptiveDuration}-minute limit. Do only one small attempt from this task: ${baseSteps[0]}`, "Stop at the time limit. Record what you tried, one observable result, and the next step; a partial attempt is useful evidence."]
        : adjustment === "instructions"
          ? [`Read today's success criteria, then describe one small result in your own words. Follow just this first action: ${baseSteps[0]}`, "Compare your attempt with the success criteria. Write the specific part that is still unclear and one change you can test."]
          : adjustment === "confidence" || adaptation === "too_hard"
            ? [`Read the task below, then try only one repetition or the first small substep. Stop there; you do not need the full set, to publish, or to show anyone. Task: ${baseSteps[0]}`, "Keep the rough result, name one thing that worked, and repeat only the hardest part once if comfortable."]
            : profile.lastMissionUseful === false
              ? [`Choose a real, small situation where ${missionFocusSkill} would help you today. Use this task to make something useful for that situation: ${baseSteps[0]}`, "Test whether the result helps with your chosen situation. Record what worked or why it did not, then choose one concrete correction."]
              : adaptation === "too_easy"
                ? [baseSteps[0], "Make a second controlled attempt with one safe variable changed. Compare both results against the same quality measure and explain which change helped; do not add risk or rush the task."]
                : baseSteps;

    return {
      id: `plan-${planKey}-${(skillSlug || "focus").slice(0, 32)}-${cycleKey}-day-${day}`,
      day,
      title,
      description: `${steps[0]} This moves you toward “${goalContext || customGoal}”.`,
      steps,
      skills: Array.from(new Set([...focusSkills, ...template.skills])).slice(0, 5),
      duration: adaptiveDuration,
      difficulty,
      reward: 30 + day * 10,
      coinReward: 10 + Math.min(day, 5),
      proof: "Record what you tried and one observable result. A written log is enough; a photo or short video is optional.",
      skillId: (missionFocusSkill.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || skillSlug || "focused-practice").slice(0, 48),
      goal: missionGoal,
      track,
      focusSkill: missionFocusSkill,
      resourceLabel: `${level.includes("advanced") ? "Deeper" : "Beginner-friendly"} video search for this mission`,
      resourceUrl: `https://www.youtube.com/results?search_query=${query}`,
      guideLabel: resources.guideLabel,
      guideUrl: resources.guideUrl,
      // A faith preference is sensitive. Keep it out of route parameters and
      // external map links; the learning screen reads it locally on demand.
      mapQuery: isSpiritual ? undefined : template.mapQuery,
      why: `${day === 1 ? "This creates a clear baseline for the rest of your cycle." : `Day ${day} builds on the previous step so you improve one measurable part at a time.`}${adaptation === "too_hard" ? " Your last mission felt hard, so this version is smaller and more guided." : adaptation === "too_easy" ? " Your last mission felt easy, so this version raises the challenge." : ""}${profile.lastMissionUseful === false ? " The focus has been made more practical because the last mission was not useful enough." : ""}${personalizedContext}`,
      onePercent: `Today you are not trying to master ${missionFocusSkill}. You are improving one specific part: ${title.toLowerCase()}.`,
      successCriteria: adjustment === "tools"
        ? "Save a clearly labelled preparation or simulation, the missing tool, and the next real test. Do not record a simulated result as a real-world outcome."
        : adjustment === "time"
        ? `Record one honest attempt within ${adaptiveDuration} minutes, its observed result, and where you will continue. A full-size result is not required for this smaller session.`
        : adjustment === "confidence" || adaptation === "too_hard"
        ? "Record one safe practice attempt or small substep, one observation, and a manageable next move. The full set is not required for this smaller session."
        : isBeyblade
        ? "Your log records the equipment, conditions, every trial's result, and one next adjustment. Include spin times or battle outcomes as directed; compare averages only under the same conditions."
        : isFirstCustomerResearchMission
        ? "Your saved result records one audience, one problem, and three neutral, open-ended draft questions. It records a prepared draft—not completed interviews or validated demand."
        : `Finish the mission steps and record an observable result from your ${missionFocusSkill} work.`,
      coachTip: isFirstCustomerResearchMission
        ? "Worked example (draft only): Audience—students who struggle to start homework. Ask: “Tell me about the last time starting homework felt difficult.” “What did you do next?” “What would have made starting easier?”"
        : level.includes("advanced")
        ? `Raise the standard: measure one quality signal and compare it with your previous attempt.`
        : `Keep the first attempt small. Clear completion teaches you more than waiting for a perfect attempt.`,
      ifStuck: isBeyblade
        ? "If you have safe equipment, begin with three solo launches and record each result. Without equipment, study the manufacturer's instructions and prepare your trial log; complete the launch test when equipment is available."
        : `Do the smallest version in 5 minutes: create one rough example, study what happened, then improve only one part.`,
      reflectionPrompt: `What changed in your ${missionFocusSkill} ability, and what single adjustment should tomorrow's mission make?`,
      safetyNote: safetyNoteFor(`${missionGoal} ${customGoal} ${weeklySkill}`),
      sourceNote: isSpiritual
        ? "Start with a primary text or teacher you trust. Check translations and context with your community. RISE does not rank religions or decide which belief is true."
        : undefined,
      resourceNote: isSpiritual
        ? undefined
        : "Video cards open a contextual YouTube search, not a reviewed recommendation. When a publisher guide appears, confirm the publisher and updated date before relying on it.",
    };
  });
}
