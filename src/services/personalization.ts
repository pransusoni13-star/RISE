import AsyncStorage from "@react-native-async-storage/async-storage";
import { loadSensitiveProfile, saveSensitiveProfile, SensitiveProfile } from "./sensitiveStorage";
import { syncUserProfile } from "./auth";

export const PERSONALIZATION_KEY = "RISE_PERSONALIZATION";

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
};

const fallbackProfile: RiseProfile = {
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

export function getRecommendedSkills(goal: string): string[] {
  return skillRecommendations[goal] || [
    "Foundations",
    "Focused Practice",
    "Communication",
    "Problem Solving",
    "Real Projects",
    "Feedback",
  ];
}

export async function loadProfile(): Promise<RiseProfile> {
  try {
    const raw = await AsyncStorage.getItem(PERSONALIZATION_KEY);
    const saved = raw ? JSON.parse(raw) as Partial<RiseProfile> : {};
    const legacySensitive: SensitiveProfile = {
      spiritualTradition: saved.spiritualTradition,
      trustedSources: saved.trustedSources,
    };
    const safeSaved = { ...saved };
    delete safeSaved.spiritualTradition;
    delete safeSaved.trustedSources;
    const protectedSensitive = await loadSensitiveProfile();
    const sensitive = Object.keys(protectedSensitive).length > 0 ? protectedSensitive : legacySensitive;

    if (saved.spiritualTradition || saved.trustedSources) {
      await Promise.all([
        AsyncStorage.setItem(PERSONALIZATION_KEY, JSON.stringify(safeSaved)),
        saveSensitiveProfile(sensitive),
      ]);
    }

    return {
      ...fallbackProfile,
      ...safeSaved,
      ...sensitive,
      selectedGoals:
        Array.isArray(safeSaved.selectedGoals) && safeSaved.selectedGoals.length
          ? safeSaved.selectedGoals.slice(0, 2)
          : fallbackProfile.selectedGoals,
    };
  } catch {
    return fallbackProfile;
  }
}

export async function saveProfile(profile: RiseProfile): Promise<void> {
  const { spiritualTradition, trustedSources, ...safeProfile } = profile;
  await Promise.all([
    AsyncStorage.setItem(PERSONALIZATION_KEY, JSON.stringify(safeProfile)),
    saveSensitiveProfile({ spiritualTradition, trustedSources }),
  ]);
  await syncUserProfile(profile).catch(() => undefined);
}

export async function updateProfile(
  changes: Partial<RiseProfile>
): Promise<RiseProfile> {
  const current = await loadProfile();
  const next = { ...current, ...changes };
  await saveProfile(next);
  return next;
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
    "Study a strong example",
    "Practice the smallest skill",
    "Get real feedback",
    "Apply it in the real world",
    "Fix the weakest part",
    "Prove your improvement",
  ],
  actions: [
    "Turn your goal into one observable result you can improve this week.",
    "Find a credible example of excellent work. List three choices that make it effective.",
    "Practice the smallest repeatable part of the skill with full attention.",
    "Show your work to one relevant person and ask what would make it more useful.",
    "Use the skill to create a real result for yourself or another person.",
    "Review your evidence and improve the single weakest part.",
    "Create a before-and-after comparison and choose your next 1% improvement.",
  ],
  skills: ["Focused practice", "Feedback", "Execution"],
  search: "beginner practical tutorial deliberate practice",
};

function resolveTemplate(goal: string, customGoal: string): MissionTemplate {
  const combined = `${goal} ${customGoal}`.toLowerCase();
  if (/spiritual|faith|religion|god|prayer|scripture/.test(combined)) return templates.spirituality;
  if (/react native/.test(combined)) return templates["react-native"];
  if (/thumbnail/.test(combined)) return templates.thumbnails;
  if (/\bhooks?\b/.test(combined)) return templates.hooks;
  if (/\bfades?\b|blending|clipper/.test(combined)) return templates.fades;
  if (/youtube|creator|video|channel/.test(combined)) return templates.youtube;
  if (/barber|haircut|fade|hair/.test(combined)) return templates.barbering;
  if (/engineer|engineering|mechanical|electrical|civil|prototype/.test(combined)) return templates.engineering;
  if (/code|coding|software|developer|program/.test(combined)) return templates.coding;
  return genericTemplate;
}

function safetyNoteFor(goal: string): string {
  const value = goal.toLowerCase();
  if (/athlete|fitness|sport|basketball/.test(value)) return "Use safe form, suitable equipment, and a clear practice area. Stop if you feel pain, dizziness, or unusual discomfort.";
  if (/barber|hair/.test(value)) return "Sanitize tools, get the model or client's permission, protect skin and eyes, and do not attempt chemical or medical procedures without qualified supervision.";
  if (/medicine|health/.test(value)) return "Use this only for education. Do not diagnose, treat, or change medication; use qualified medical guidance for personal decisions.";
  if (/finance/.test(value)) return "Practice with examples or simulated numbers. This mission is educational and is not personalized investment, tax, or financial advice.";
  if (/law/.test(value)) return "Use this for general learning only. Laws vary by location; do not treat the mission as legal advice for a real case.";
  if (/engineer|aerospace/.test(value)) return "Prototype at low risk. Do not test mains electricity, pressure systems, vehicles, flight hardware, or structural loads without qualified supervision.";
  return "Protect private information, use work you created or have permission to use, and stop or simplify any step that feels unsafe.";
}

function trustedResources(goal: string, template: MissionTemplate, title: string) {
  const value = goal.toLowerCase();
  if (/software|code|developer|program/.test(value) || template === templates["react-native"] || template === templates.coding) {
    return { video: `React Native official ${title} tutorial -shorts`, guideLabel: "React Native official guide", guideUrl: "https://reactnative.dev/docs/getting-started" };
  }
  if (/youtube|creator|video/.test(value) || template === templates.youtube || template === templates.hooks || template === templates.thumbnails) {
    return { video: `YouTube Creators official ${title} -shorts`, guideLabel: "YouTube official creator guidance", guideUrl: "https://support.google.com/youtube/answer/16559650?hl=en" };
  }
  if (/engineer|aerospace/.test(value) || template === templates.engineering) {
    return { video: `NASA engineering design process ${title} -shorts`, guideLabel: "NASA engineering design process", guideUrl: "https://www.jpl.nasa.gov/edu/resources/image/engineering-design-process-flow-chart/" };
  }
  if (/fitness|athlete|basketball|mobility|wellbeing|nutrition/.test(value)) {
    return /nutrition/.test(value)
      ? { video: `CDC healthy eating ${title} -shorts`, guideLabel: "CDC healthy eating guidance", guideUrl: "https://www.cdc.gov/nutrition/features/healthy-eating-tips.html" }
      : { video: `ACE Fitness official ${title} beginner -shorts`, guideLabel: "ACE exercise form library", guideUrl: "https://www.acefitness.org/resources/everyone/exercise-library/" };
  }
  if (/barber|hair/.test(value) || template === templates.barbering || template === templates.fades) {
    return { video: `MiladyPro barber education ${title} -shorts`, guideLabel: "Official barber health and safety guide", guideUrl: "https://www.barbercosmo.ca.gov/schools/healthsafety_course.shtml" };
  }
  if (/spiritual|faith/.test(value) || template === templates.spirituality) {
    return { video: `${title} primary source qualified teacher full lesson -shorts`, guideLabel: "Use your trusted primary source", guideUrl: undefined };
  }
  return { video: `${title} full beginner lesson trusted educator -shorts`, guideLabel: "Khan Academy learning guidance", guideUrl: "https://www.khanacademy.org/college-careers-more/learnstorm-growth-mindset-activities-us" };
}

export function createSevenDayPlan(profile: RiseProfile): PersonalizedMission[] {
  const selectedGoals = profile.selectedGoals.length
    ? profile.selectedGoals.slice(0, 2)
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
  const cycleKey = (profile.skillStartDate || "current").slice(0, 10);
  const adaptation = profile.lastDifficultyFeedback;
  const adaptiveDuration = adaptation === "too_hard"
    ? Math.max(10, Math.round(duration * 0.7))
    : adaptation === "too_easy"
      ? Math.min(90, Math.round(duration * 1.15))
      : duration;

  return Array.from({ length: cycleLength }, (_, index) => {
    const day = index + 1;
    const missionGoal = selectedGoals[index % selectedGoals.length] || goal;
    const template = resolveTemplate(missionGoal, `${customGoal} ${weeklySkill}`);
    const templateIndex = index % template.titles.length;
    const round = Math.floor(index / template.titles.length) + 1;
    const title = `${round > 1 ? `Level ${round}: ` : ""}${template.titles[templateIndex]}`;
    const resources = trustedResources(missionGoal, template, title);
    const difficulty: PersonalizedMission["difficulty"] = adaptation === "too_easy"
      ? (day <= 2 ? "Stretch" : "Challenge")
      : adaptation === "too_hard"
        ? (day <= 5 ? "Starter" : "Stretch")
        : (day <= 2 ? "Starter" : day <= 5 ? "Stretch" : "Challenge");
    const personalizedContext = profile.currentSituation?.trim()
      ? ` Starting from: ${profile.currentSituation.trim()}`
      : "";
    const spiritualContext = `${profile.spiritualTradition || ""} ${profile.trustedSources || ""}`.trim();
    const query = encodeURIComponent(`${resources.video} ${weeklySkill} ${customGoal} ${spiritualContext}`.trim());
    const isSpiritual = template === templates.spirituality;

    return {
      id: `${selectedGoals.join("-")}-${skillSlug || "focus"}-${cycleKey}-day-${day}`,
      day,
      title,
      description: `${template.actions[templateIndex]} This builds your ${missionGoal.replace(/-/g, " ")} track and moves you toward “${customGoal}”.`,
      steps: [
        `Choose one result you can finish in ${adaptiveDuration} minutes.`,
        template.actions[templateIndex],
        "Attach proof and write 2–3 sentences about what changed.",
      ],
      skills: Array.from(new Set([...focusSkills, ...template.skills])).slice(0, 5),
      duration: adaptiveDuration,
      difficulty,
      reward: 30 + day * 10,
      coinReward: 10 + Math.min(day, 5),
      proof: "Attach a screenshot/photo or a short video showing the work and its result.",
      skillId: day < 3 ? "foundations" : day < 6 ? "practical-skills" : "projects",
      goal: missionGoal,
      resourceLabel: `${level.includes("advanced") ? "Deeper" : "Beginner-friendly"} video for this mission`,
      resourceUrl: `https://www.youtube.com/results?search_query=${query}`,
      guideLabel: resources.guideLabel,
      guideUrl: resources.guideUrl,
      mapQuery: isSpiritual && profile.spiritualTradition
        ? `${profile.spiritualTradition} community near me`
        : template.mapQuery,
      why: `Day ${day} builds on the previous step so you improve one measurable part at a time.${adaptation === "too_hard" ? " Your last mission felt hard, so this version is smaller and more guided." : adaptation === "too_easy" ? " Your last mission felt easy, so this version raises the challenge." : ""}${profile.lastMissionUseful === false ? " The focus has been made more practical because the last mission was not useful enough." : ""}${personalizedContext}`,
      onePercent: `Today you are not trying to master ${weeklySkill}. You are improving one specific part: ${title.toLowerCase()}.`,
      successCriteria: `Finish the mission steps and attach clear evidence that shows your ${weeklySkill} work.`,
      coachTip: level.includes("advanced")
        ? `Raise the standard: measure one quality signal and compare it with your previous attempt.`
        : `Keep the first attempt small. Clear completion teaches you more than waiting for a perfect attempt.`,
      ifStuck: `Do the smallest version in 5 minutes: create one rough example, study what happened, then improve only one part.`,
      reflectionPrompt: `What changed in your ${weeklySkill} ability, and what single adjustment should tomorrow's mission make?`,
      safetyNote: safetyNoteFor(`${missionGoal} ${customGoal} ${weeklySkill}`),
      sourceNote: isSpiritual
        ? `Start with ${profile.trustedSources?.trim() || "the primary texts or books you personally trust"}. Treat YouTube as discovery, not authority; verify claims with context and a qualified community leader you trust. RISE does not decide which religion is true or rank traditions.`
        : undefined,
    };
  });
}
