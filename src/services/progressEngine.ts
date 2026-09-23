// ============================================================
// RISE PROGRESS ENGINE
// Goal-aware XP • Skills • Quizzes • Missions • Projects
// Adaptive recommendations • Streaks • Achievements
// ============================================================

import AsyncStorage from "@react-native-async-storage/async-storage";

// ============================================================
// TYPES
// ============================================================

export type XPEventType =
  | "quiz"
  | "mission"
  | "project"
  | "proof"
  | "learning"
  | "assessment"
  | "milestone"
  | "streak";

export type XPEventMetadata = {
  skillId?: string;
  goal?: string;
  score?: number;
  difficulty?: string;
  durationMinutes?: number;
  coins?: number;
  passed?: boolean;
  source?: string;
};

export type XPEvent = {
  id: string;
  type: XPEventType;
  amount: number;
  title: string;
  timestamp: number;
  metadata?: XPEventMetadata;
};

export type Skill = {
  id: string;
  name: string;
  description: string;
  xp: number;
  requiredXP: number;
  level: number;
  goal?: string;
};

export type RISEProgress = {
  totalXP: number;
  level: number;
  coins: number;
  events: XPEvent[];
  skills: Skill[];
};

export type RISERecommendation = {
  title: string;
  description: string;
  skillId: string | null;
  why?: string;
  difficulty?: "Easy" | "Medium" | "Hard" | "Insane";
  type?: "learning" | "quiz" | "mission" | "project" | "review";
};

// ============================================================
// CONSTANTS
// ============================================================

export const STORAGE_KEY = "RISE_PROGRESS";

const MAX_EVENTS = 500;

// ============================================================
// GOAL NORMALIZATION
// ============================================================

export function normalizeGoal(goal?: string | null): string {
  if (!goal || typeof goal !== "string") {
    return "personal";
  }

  return goal
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");
}

// ============================================================
// SKILL TEMPLATES
// ============================================================

type SkillTemplate = {
  id: string;
  name: string;
  description: string;
  requiredXP: number;
};

const BASE_SKILL_TEMPLATES: SkillTemplate[] = [
  {
    id: "foundations",
    name: "Foundations",
    description:
      "Build the core knowledge required for your goal.",
    requiredXP: 100,
  },
  {
    id: "problem-solving",
    name: "Problem Solving",
    description:
      "Learn how to analyze problems and think critically.",
    requiredXP: 150,
  },
  {
    id: "practical-skills",
    name: "Practical Skills",
    description:
      "Turn knowledge into useful real-world ability.",
    requiredXP: 200,
  },
  {
    id: "projects",
    name: "Projects",
    description:
      "Build real things that demonstrate your ability.",
    requiredXP: 300,
  },
  {
    id: "advanced",
    name: "Advanced Skills",
    description:
      "Develop deeper expertise and tackle harder challenges.",
    requiredXP: 500,
  },
];

const GOAL_SKILL_TEMPLATES: Record<
  string,
  SkillTemplate[]
> = {
  coding: [
    {
      id: "foundations",
      name: "Programming Fundamentals",
      description:
        "Variables, logic, functions, data structures and core programming.",
      requiredXP: 100,
    },
    {
      id: "problem-solving",
      name: "Computational Problem Solving",
      description:
        "Break problems down and create efficient solutions.",
      requiredXP: 150,
    },
    {
      id: "practical-skills",
      name: "Applied Development",
      description:
        "Build useful software and work with real development tools.",
      requiredXP: 200,
    },
    {
      id: "projects",
      name: "Real Projects",
      description:
        "Create portfolio-quality software that solves real problems.",
      requiredXP: 300,
    },
    {
      id: "advanced",
      name: "Advanced Development",
      description:
        "Move into advanced systems, AI and production development.",
      requiredXP: 500,
    },
  ],

  business: [
    {
      id: "foundations",
      name: "Business Foundations",
      description:
        "Understand markets, customers, value and business models.",
      requiredXP: 100,
    },
    {
      id: "problem-solving",
      name: "Market Research",
      description:
        "Find real problems and understand customers.",
      requiredXP: 150,
    },
    {
      id: "practical-skills",
      name: "Marketing & Positioning",
      description:
        "Learn how to communicate value and attract customers.",
      requiredXP: 200,
    },
    {
      id: "projects",
      name: "Launch Experiments",
      description:
        "Build and test real offers, products and businesses.",
      requiredXP: 300,
    },
    {
      id: "advanced",
      name: "Strategy & Growth",
      description:
        "Develop advanced strategic and growth skills.",
      requiredXP: 500,
    },
  ],

  finance: [
    {
      id: "foundations",
      name: "Financial Foundations",
      description:
        "Understand money, saving, investing and financial systems.",
      requiredXP: 100,
    },
    {
      id: "problem-solving",
      name: "Company Analysis",
      description:
        "Analyze businesses, financial statements and opportunities.",
      requiredXP: 150,
    },
    {
      id: "practical-skills",
      name: "Planning & Modeling",
      description:
        "Build budgets, forecasts and financial models.",
      requiredXP: 200,
    },
    {
      id: "projects",
      name: "Investment Projects",
      description:
        "Apply financial knowledge to real-world analysis.",
      requiredXP: 300,
    },
    {
      id: "advanced",
      name: "Portfolio Strategy",
      description:
        "Develop deeper investing and portfolio-management skills.",
      requiredXP: 500,
    },
  ],

  engineering: [
    {
      id: "foundations",
      name: "Engineering Fundamentals",
      description:
        "Build strong technical and engineering foundations.",
      requiredXP: 100,
    },
    {
      id: "problem-solving",
      name: "Systems Thinking",
      description:
        "Analyze constraints, systems and engineering problems.",
      requiredXP: 150,
    },
    {
      id: "practical-skills",
      name: "Prototype & Test",
      description:
        "Design, prototype, test and improve solutions.",
      requiredXP: 200,
    },
    {
      id: "projects",
      name: "Real Engineering Systems",
      description:
        "Build meaningful engineering projects.",
      requiredXP: 300,
    },
    {
      id: "advanced",
      name: "Advanced Engineering",
      description:
        "Handle increasingly complex technical systems.",
      requiredXP: 500,
    },
  ],

  education: [
    {
      id: "foundations",
      name: "Learning Foundations",
      description:
        "Understand how to learn effectively.",
      requiredXP: 100,
    },
    {
      id: "problem-solving",
      name: "Study Strategy",
      description:
        "Analyze weaknesses and improve your learning process.",
      requiredXP: 150,
    },
    {
      id: "practical-skills",
      name: "Applied Learning",
      description:
        "Turn information into usable knowledge.",
      requiredXP: 200,
    },
    {
      id: "projects",
      name: "Demonstrate Knowledge",
      description:
        "Create projects and explanations that prove understanding.",
      requiredXP: 300,
    },
    {
      id: "advanced",
      name: "Mastery",
      description:
        "Develop advanced understanding and teaching ability.",
      requiredXP: 500,
    },
  ],

  fitness: [
    {
      id: "foundations",
      name: "Fitness Foundations",
      description:
        "Build knowledge of training, recovery and nutrition.",
      requiredXP: 100,
    },
    {
      id: "problem-solving",
      name: "Training Strategy",
      description:
        "Understand how to adjust training based on progress.",
      requiredXP: 150,
    },
    {
      id: "practical-skills",
      name: "Training Execution",
      description:
        "Apply effective training techniques consistently.",
      requiredXP: 200,
    },
    {
      id: "projects",
      name: "Fitness Challenges",
      description:
        "Complete measurable fitness challenges.",
      requiredXP: 300,
    },
    {
      id: "advanced",
      name: "Advanced Performance",
      description:
        "Develop advanced performance and programming skills.",
      requiredXP: 500,
    },
  ],

  personal: BASE_SKILL_TEMPLATES,
};

// ============================================================
// GET TEMPLATES
// ============================================================

function getSkillTemplates(
  goal?: string
): SkillTemplate[] {
  const normalizedGoal = normalizeGoal(goal);

  return (
    GOAL_SKILL_TEMPLATES[normalizedGoal] ||
    GOAL_SKILL_TEMPLATES.personal
  );
}

// ============================================================
// DEFAULT PROGRESS
// ============================================================

export function createDefaultProgress(): RISEProgress {
  return {
    totalXP: 0,
    level: 1,
    coins: 0,
    events: [],
    skills: createGoalSkills("personal"),
  };
}

// ============================================================
// CREATE GOAL SKILLS
// ============================================================

export function createGoalSkills(
  goal: string
): Skill[] {
  const normalizedGoal = normalizeGoal(goal);
  const templates = getSkillTemplates(normalizedGoal);

  return templates.map((template) => ({
    ...template,
    xp: 0,
    level: 1,
    goal: normalizedGoal,
  }));
}

// ============================================================
// LEVEL SYSTEM
// ============================================================

export function getXPForNextLevel(
  level: number
): number {
  const safeLevel = Math.max(
    1,
    Math.floor(Number(level) || 1)
  );

  return 100 + (safeLevel - 1) * 50;
}

export function calculateLevel(
  totalXP: number
): number {
  let level = 1;
  let remainingXP = Math.max(
    0,
    Number(totalXP) || 0
  );

  while (
    remainingXP >=
    getXPForNextLevel(level)
  ) {
    remainingXP -= getXPForNextLevel(level);
    level++;
  }

  return level;
}

export function getCurrentLevelXP(
  totalXP: number
): number {
  let level = 1;
  let remainingXP = Math.max(
    0,
    Number(totalXP) || 0
  );

  while (
    remainingXP >=
    getXPForNextLevel(level)
  ) {
    remainingXP -= getXPForNextLevel(level);
    level++;
  }

  return remainingXP;
}

// ============================================================
// SKILL LEVEL
// ============================================================

export function calculateSkillLevel(
  xp: number,
  requiredXP: number
): number {
  let level = 1;
  let currentXP = Math.max(
    0,
    Number(xp) || 0
  );

  let requirement = Math.max(
    1,
    Number(requiredXP) || 100
  );

  while (currentXP >= requirement) {
    currentXP -= requirement;
    level++;

    requirement = Math.max(
      requirement + 50,
      Math.round(requirement * 1.25)
    );
  }

  return level;
}

// ============================================================
// EVENT VALIDATION
// ============================================================

function isValidEventType(
  type: unknown
): type is XPEventType {
  return [
    "quiz",
    "mission",
    "project",
    "proof",
    "learning",
    "assessment",
    "milestone",
    "streak",
  ].includes(type as string);
}

// ============================================================
// NORMALIZE EVENTS
// ============================================================

function normalizeEvents(
  events: unknown
): XPEvent[] {
  if (!Array.isArray(events)) {
    return [];
  }

  return events
    .filter(Boolean)
    .map((event: any) => {
      const metadata =
        event?.metadata &&
        typeof event.metadata === "object"
          ? {
              skillId:
                typeof event.metadata.skillId ===
                "string"
                  ? event.metadata.skillId
                  : undefined,

              goal:
                typeof event.metadata.goal ===
                "string"
                  ? normalizeGoal(
                      event.metadata.goal
                    )
                  : undefined,

              score:
                typeof event.metadata.score ===
                "number" &&
                Number.isFinite(
                  event.metadata.score
                )
                  ? event.metadata.score
                  : undefined,

              difficulty:
                typeof event.metadata
                  .difficulty === "string"
                  ? event.metadata.difficulty
                  : undefined,

              durationMinutes:
                typeof event.metadata
                  .durationMinutes === "number" &&
                Number.isFinite(
                  event.metadata
                    .durationMinutes
                )
                  ? event.metadata
                      .durationMinutes
                  : undefined,

              coins:
                typeof event.metadata.coins ===
                  "number" &&
                Number.isFinite(
                  event.metadata.coins
                )
                  ? event.metadata.coins
                  : undefined,

              passed:
                typeof event.metadata.passed ===
                "boolean"
                  ? event.metadata.passed
                  : undefined,

              source:
                typeof event.metadata.source ===
                "string"
                  ? event.metadata.source
                  : undefined,
            }
          : undefined;

      return {
        id:
          typeof event?.id === "string"
            ? event.id
            : `${Date.now()}-${Math.random()
                .toString(36)
                .slice(2)}`,

        type: isValidEventType(event?.type)
          ? event.type
          : "learning",

        amount:
          typeof event?.amount === "number" &&
          Number.isFinite(event.amount)
            ? Math.max(0, Math.round(event.amount))
            : 0,

        title:
          typeof event?.title === "string"
            ? event.title
            : "RISE Activity",

        timestamp:
          typeof event?.timestamp === "number" &&
          Number.isFinite(event.timestamp)
            ? event.timestamp
            : Date.now(),

        metadata,
      };
    })
    .slice(-MAX_EVENTS);
}

// ============================================================
// NORMALIZE SKILLS
// ============================================================

function normalizeSkills(
  skills: unknown
): Skill[] {
  if (!Array.isArray(skills)) {
    return [];
  }

  return skills
    .filter(Boolean)
    .map((skill: any) => {
      const xp =
        typeof skill?.xp === "number" &&
        Number.isFinite(skill.xp)
          ? Math.max(0, skill.xp)
          : 0;

      const requiredXP =
        typeof skill?.requiredXP === "number" &&
        Number.isFinite(skill.requiredXP)
          ? Math.max(1, skill.requiredXP)
          : 100;

      return {
        id:
          typeof skill?.id === "string"
            ? skill.id
            : "foundations",

        name:
          typeof skill?.name === "string"
            ? skill.name
            : "Foundations",

        description:
          typeof skill?.description ===
          "string"
            ? skill.description
            : "",

        xp,

        requiredXP,

        level:
          typeof skill?.level === "number" &&
          Number.isFinite(skill.level)
            ? Math.max(
                1,
                Math.floor(skill.level)
              )
            : calculateSkillLevel(
                xp,
                requiredXP
              ),

        goal:
          typeof skill?.goal === "string"
            ? normalizeGoal(skill.goal)
            : undefined,
      };
    });
}

// ============================================================
// NORMALIZE PROGRESS
// ============================================================

export function normalizeProgress(
  input?: Partial<RISEProgress> | null
): RISEProgress {
  if (!input) {
    return createDefaultProgress();
  }

  const totalXP =
    typeof input.totalXP === "number" &&
    Number.isFinite(input.totalXP)
      ? Math.max(
          0,
          Math.round(input.totalXP)
        )
      : 0;

  const coins =
    typeof input.coins === "number" &&
    Number.isFinite(input.coins)
      ? Math.max(
          0,
          Math.floor(input.coins)
        )
      : 0;

  const events = normalizeEvents(
    input.events
  );

  const skills = normalizeSkills(
    input.skills
  );

  return {
    totalXP,
    level: calculateLevel(totalXP),
    coins,
    events,
    skills:
      skills.length > 0
        ? skills
        : createGoalSkills("personal"),
  };
}

// ============================================================
// BUILD GOAL SKILL TREE
// ============================================================

export function buildSkillTreeForGoal(
  goal: string,
  progress: RISEProgress
): Skill[] {
  const normalizedGoal =
    normalizeGoal(goal);

  const normalizedProgress =
    normalizeProgress(progress);

  const templates =
    getSkillTemplates(normalizedGoal);

  return templates.map((template) => {
    // 1. Exact goal-specific skill
    let existing =
      normalizedProgress.skills.find(
        (skill) =>
          skill.id === template.id &&
          normalizeGoal(skill.goal) ===
            normalizedGoal
      );

    // 2. Legacy skill with no goal
    if (!existing) {
      existing =
        normalizedProgress.skills.find(
          (skill) =>
            skill.id === template.id &&
            !skill.goal
        );
    }

    const xp = existing?.xp ?? 0;

    const requiredXP =
      existing?.requiredXP ??
      template.requiredXP;

    return {
      id: template.id,
      name: template.name,
      description: template.description,
      xp,
      requiredXP,
      level: calculateSkillLevel(
        xp,
        requiredXP
      ),
      goal: normalizedGoal,
    };
  });
}

// ============================================================
// ADD XP
// ============================================================

export function addXP(
  progress: RISEProgress,
  amount: number,
  type: XPEventType,
  title: string,
  coins: number = 0,
  metadata?: XPEventMetadata
): RISEProgress {
  const normalized =
    normalizeProgress(progress);

  const safeAmount = Math.max(
    0,
    Math.round(Number(amount) || 0)
  );

  const safeCoins = Math.max(
    0,
    Math.round(Number(coins) || 0)
  );

  const event: XPEvent = {
    id: `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`,

    type,

    amount: safeAmount,

    title:
      typeof title === "string" &&
      title.trim()
        ? title.trim()
        : "RISE Activity",

    timestamp: Date.now(),

    metadata: {
      ...metadata,
      coins: safeCoins,
      goal: metadata?.goal
        ? normalizeGoal(metadata.goal)
        : undefined,
    },
  };

  const totalXP =
    normalized.totalXP + safeAmount;

  return {
    ...normalized,

    totalXP,

    level: calculateLevel(totalXP),

    coins:
      normalized.coins + safeCoins,

    events: [
      ...normalized.events,
      event,
    ].slice(-MAX_EVENTS),
  };
}

// ============================================================
// ADD SKILL XP
// ============================================================

export function addSkillXP(
  progress: RISEProgress,
  skillId: string,
  amount: number,
  goal?: string
): RISEProgress {
  const normalized =
    normalizeProgress(progress);

  const safeAmount = Math.max(
    0,
    Math.round(Number(amount) || 0)
  );

  if (safeAmount <= 0) {
    return normalized;
  }

  const normalizedGoal = goal
    ? normalizeGoal(goal)
    : undefined;

  let skillIndex = -1;

  // Always prioritize exact goal skill.
  if (normalizedGoal) {
    skillIndex =
      normalized.skills.findIndex(
        (skill) =>
          skill.id === skillId &&
          normalizeGoal(skill.goal) ===
            normalizedGoal
      );
  }

  // Backward compatibility for old global skills.
  if (skillIndex === -1) {
    skillIndex =
      normalized.skills.findIndex(
        (skill) =>
          skill.id === skillId &&
          !skill.goal
      );
  }

  // Create the goal skill if missing.
  if (skillIndex === -1) {
    const templates =
      getSkillTemplates(
        normalizedGoal || "personal"
      );

    const template =
      templates.find(
        (item) => item.id === skillId
      ) || templates[0];

    normalized.skills.push({
      id: template.id,
      name: template.name,
      description: template.description,
      xp: 0,
      requiredXP: template.requiredXP,
      level: 1,
      goal:
        normalizedGoal || "personal",
    });

    skillIndex =
      normalized.skills.length - 1;
  }

  const skills = [
    ...normalized.skills,
  ];

  const skill = {
    ...skills[skillIndex],
  };

  let remainingXP =
    skill.xp + safeAmount;

  let requiredXP =
    Math.max(
      1,
      skill.requiredXP
    );

  let level =
    Math.max(
      1,
      skill.level
    );

  while (
    remainingXP >= requiredXP
  ) {
    remainingXP -= requiredXP;

    level++;

    requiredXP = Math.max(
      requiredXP + 50,
      Math.round(
        requiredXP * 1.25
      )
    );
  }

  skills[skillIndex] = {
    ...skill,
    xp: remainingXP,
    requiredXP,
    level,
  };

  return {
    ...normalized,
    skills,
  };
}

// ============================================================
// GET SKILL PROGRESS
// ============================================================

export function getSkillProgress(
  skill: Skill
): number {
  if (
    !skill ||
    skill.requiredXP <= 0
  ) {
    return 0;
  }

  return Math.min(
    100,
    Math.round(
      (skill.xp /
        skill.requiredXP) *
        100
    )
  );
}

// ============================================================
// CURRENT SKILL
// ============================================================

export function getCurrentSkill(
  skills: Skill[]
): Skill | null {
  if (!skills.length) {
    return null;
  }

  const incomplete =
    skills.filter(
      (skill) =>
        skill.xp <
        skill.requiredXP
    );

  if (incomplete.length > 0) {
    return incomplete.reduce(
      (best, skill) =>
        getSkillProgress(skill) >
        getSkillProgress(best)
          ? skill
          : best
    );
  }

  return skills[
    skills.length - 1
  ];
}

// ============================================================
// NEXT UNLOCK
// ============================================================

export function getNextUnlock(
  skills: Skill[]
): Skill | null {
  return (
    skills.find(
      (skill) =>
        skill.xp <
        skill.requiredXP
    ) || null
  );
}

// ============================================================
// WEAKEST SKILL
// ============================================================

export function getWeakestSkill(
  skills: Skill[]
): Skill | null {
  if (!skills.length) {
    return null;
  }

  return skills.reduce(
    (weakest, skill) =>
      getSkillProgress(skill) <
      getSkillProgress(
        weakest
      )
        ? skill
        : weakest
  );
}

// ============================================================
// STRONGEST SKILL
// ============================================================

export function getStrongestSkill(
  skills: Skill[]
): Skill | null {
  if (!skills.length) {
    return null;
  }

  return skills.reduce(
    (strongest, skill) =>
      getSkillProgress(skill) >
      getSkillProgress(
        strongest
      )
        ? skill
        : strongest
  );
}

// ============================================================
// QUIZ HISTORY
// ============================================================

export function getQuizEvents(
  progress: RISEProgress,
  skillId?: string,
  goal?: string
): XPEvent[] {
  const normalizedGoal =
    goal
      ? normalizeGoal(goal)
      : undefined;

  return progress.events.filter(
    (event) => {
      if (
        event.type !== "quiz"
      ) {
        return false;
      }

      if (
        skillId &&
        event.metadata
          ?.skillId !== skillId
      ) {
        return false;
      }

      if (
        normalizedGoal &&
        normalizeGoal(
          event.metadata?.goal
        ) !== normalizedGoal
      ) {
        return false;
      }

      return true;
    }
  );
}

// ============================================================
// LATEST QUIZ
// ============================================================

export function getLatestQuiz(
  progress: RISEProgress,
  skillId?: string,
  goal?: string
): XPEvent | null {
  const quizzes =
    getQuizEvents(
      progress,
      skillId,
      goal
    );

  return quizzes.length
    ? quizzes[
        quizzes.length - 1
      ]
    : null;
}

// ============================================================
// AVERAGE QUIZ SCORE
// ============================================================

export function getAverageQuizScore(
  progress: RISEProgress,
  skillId?: string,
  goal?: string
): number {
  const quizzes =
    getQuizEvents(
      progress,
      skillId,
      goal
    );

  const scored =
    quizzes.filter(
      (quiz) =>
        typeof quiz.metadata
          ?.score === "number"
    );

  if (!scored.length) {
    return 0;
  }

  const total =
    scored.reduce(
      (sum, quiz) =>
        sum +
        (quiz.metadata
          ?.score || 0),
      0
    );

  return Math.round(
    total / scored.length
  );
}

// ============================================================
// ADAPTIVE DIFFICULTY
// ============================================================

export function getAdaptiveDifficulty(
  score: number
): "Easy" | "Medium" | "Hard" | "Insane" {
  const safeScore = Math.max(
    0,
    Math.min(
      100,
      Number(score) || 0
    )
  );

  if (safeScore < 50) {
    return "Easy";
  }

  if (safeScore < 70) {
    return "Medium";
  }

  if (safeScore < 85) {
    return "Hard";
  }

  return "Insane";
}

// ============================================================
// NEEDS REVIEW
// ============================================================

export function needsReview(
  progress: RISEProgress,
  skillId?: string,
  goal?: string
): boolean {
  const latest =
    getLatestQuiz(
      progress,
      skillId,
      goal
    );

  if (!latest) {
    return false;
  }

  return (
    (latest.metadata
      ?.score || 0) < 50
  );
}

// ============================================================
// ADAPTIVE REASON
// ============================================================

export function getAdaptiveReason(
  progress: RISEProgress,
  skillId?: string,
  goal?: string
): string {
  const latest =
    getLatestQuiz(
      progress,
      skillId,
      goal
    );

  if (!latest) {
    return "RISE is starting with your fundamentals so it can understand your current level.";
  }

  const score =
    latest.metadata?.score || 0;

  if (score < 50) {
    return `You scored ${score}% on your last quiz. RISE is reinforcing the fundamentals before moving you forward.`;
  }

  if (score < 70) {
    return `You scored ${score}%. RISE is giving you more practice before increasing the difficulty.`;
  }

  if (score < 85) {
    return `You scored ${score}%. Your fundamentals are developing, so RISE is increasing the challenge.`;
  }

  return `You scored ${score}%. RISE is ready to push you toward a harder challenge.`;
}

// ============================================================
// NEXT RECOMMENDATION
// ============================================================

export function getNextRecommendation(
  progress: RISEProgress,
  goal?: string
): RISERecommendation {
  const normalizedGoal =
    normalizeGoal(goal);

  const skills =
    buildSkillTreeForGoal(
      normalizedGoal,
      progress
    );

  const weakest =
    getWeakestSkill(skills);

  if (!weakest) {
    return {
      title:
        "Start Your RISE Journey",

      description:
        "Complete your first learning step to begin building your skill profile.",

      skillId: null,

      why:
        "RISE needs your first activity to understand where to take you next.",

      type: "learning",

      difficulty: "Easy",
    };
  }

  const latestQuiz =
    getLatestQuiz(
      progress,
      weakest.id,
      normalizedGoal
    );

  if (latestQuiz) {
    const score =
      latestQuiz.metadata
        ?.score || 0;

    if (score < 50) {
      return {
        title:
          `Review ${weakest.name}`,

        description:
          "Rebuild the fundamentals before moving forward.",

        skillId:
          weakest.id,

        why:
          getAdaptiveReason(
            progress,
            weakest.id,
            normalizedGoal
          ),

        type: "review",

        difficulty: "Easy",
      };
    }

    if (score >= 85) {
      return {
        title:
          `Take on a harder ${weakest.name} challenge`,

        description:
          "You've demonstrated strong understanding. RISE is increasing the difficulty.",

        skillId:
          weakest.id,

        why:
          getAdaptiveReason(
            progress,
            weakest.id,
            normalizedGoal
          ),

        type: "mission",

        difficulty: "Insane",
      };
    }
  }

  return {
    title:
      `Improve ${weakest.name}`,

    description:
      "Complete a focused learning activity and then prove what you learned.",

    skillId:
      weakest.id,

    why:
      "This is currently your lowest-progress skill, so improving it will strengthen your overall path.",

    type: "learning",

    difficulty: "Medium",
  };
}

// ============================================================
// DATE KEY
// ============================================================

function getDateKey(
  timestamp: number
): string {
  const date =
    new Date(timestamp);

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

// ============================================================
// STREAK
// ============================================================

export function getStreak(
  progress: RISEProgress
): number {
  const activeDays =
    new Set(
      progress.events.map(
        (event) =>
          getDateKey(
            event.timestamp
          )
      )
    );

  if (!activeDays.size) {
    return 0;
  }

  const today =
    new Date();

  const todayKey =
    getDateKey(
      today.getTime()
    );

  const yesterday =
    new Date(today);

  yesterday.setDate(
    yesterday.getDate() - 1
  );

  const yesterdayKey =
    getDateKey(
      yesterday.getTime()
    );

  let currentDate: Date;

  if (
    activeDays.has(
      todayKey
    )
  ) {
    currentDate = today;
  } else if (
    activeDays.has(
      yesterdayKey
    )
  ) {
    currentDate =
      yesterday;
  } else {
    return 0;
  }

  let streak = 0;

  while (
    activeDays.has(
      getDateKey(
        currentDate.getTime()
      )
    )
  ) {
    streak++;

    currentDate =
      new Date(
        currentDate
      );

    currentDate.setDate(
      currentDate.getDate() - 1
    );
  }

  return streak;
}

// ============================================================
// ACHIEVEMENTS
// ============================================================

export type Achievement = {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
};

export function getAchievements(
  progress: RISEProgress
): Achievement[] {
  const quizzes =
    getQuizEvents(progress);

  const missionCount =
    progress.events.filter(
      (event) =>
        event.type ===
        "mission"
    ).length;

  const projectCount =
    progress.events.filter(
      (event) =>
        event.type ===
        "project"
    ).length;

  const proofCount =
    progress.events.filter(
      (event) =>
        event.type ===
        "proof"
    ).length;

  const highScoreQuizzes =
    quizzes.filter(
      (quiz) =>
        (quiz.metadata
          ?.score || 0) >= 90
    ).length;

  const streak =
    getStreak(progress);

  return [
    {
      id: "first-step",
      title: "First Step",
      description:
        "Complete your first RISE activity.",
      unlocked:
        progress.events.length >
        0,
    },

    {
      id: "first-quiz",
      title: "Knowledge Check",
      description:
        "Complete your first quiz.",
      unlocked:
        quizzes.length > 0,
    },

    {
      id: "first-mission",
      title: "Take Action",
      description:
        "Complete your first mission.",
      unlocked:
        missionCount > 0,
    },

    {
      id: "first-project",
      title: "Builder",
      description:
        "Complete your first project.",
      unlocked:
        projectCount > 0,
    },

    {
      id: "first-proof",
      title: "Proof of Work",
      description:
        "Submit your first proof.",
      unlocked:
        proofCount > 0,
    },

    {
      id: "level-5",
      title: "Level 5",
      description:
        "Reach RISE Level 5.",
      unlocked:
        progress.level >= 5,
    },

    {
      id: "1000-xp",
      title: "1000 XP",
      description:
        "Earn 1000 total XP.",
      unlocked:
        progress.totalXP >= 1000,
    },

    {
      id: "five-masteries",
      title:
        "Consistent Learner",
      description:
        "Score 90%+ on five quizzes.",
      unlocked:
        highScoreQuizzes >= 5,
    },

    {
      id: "seven-day-streak",
      title:
        "Seven Day Streak",
      description:
        "Maintain a 7-day RISE streak.",
      unlocked:
        streak >= 7,
    },
  ];
}

// ============================================================
// MILESTONES
// ============================================================

export type Milestone = {
  id: string;
  title: string;
  requirement: number;
  completed: boolean;
};

export function getMilestones(
  progress: RISEProgress
): Milestone[] {
  return [
    {
      id: "xp-100",
      title: "100 XP",
      requirement: 100,
      completed:
        progress.totalXP >= 100,
    },

    {
      id: "xp-500",
      title: "500 XP",
      requirement: 500,
      completed:
        progress.totalXP >= 500,
    },

    {
      id: "xp-1000",
      title: "1000 XP",
      requirement: 1000,
      completed:
        progress.totalXP >= 1000,
    },

    {
      id: "xp-5000",
      title: "5000 XP",
      requirement: 5000,
      completed:
        progress.totalXP >= 5000,
    },

    {
      id: "level-5",
      title: "Reach Level 5",
      requirement: 5,
      completed:
        progress.level >= 5,
    },

    {
      id: "level-10",
      title: "Reach Level 10",
      requirement: 10,
      completed:
        progress.level >= 10,
    },
  ];
}

// ============================================================
// GOAL PROGRESS
// ============================================================

export function getGoalProgress(
  progress: RISEProgress,
  goal: string
): number {
  const skills =
    buildSkillTreeForGoal(
      goal,
      progress
    );

  if (!skills.length) {
    return 0;
  }

  const total =
    skills.reduce(
      (sum, skill) =>
        sum +
        getSkillProgress(
          skill
        ),
      0
    );

  return Math.round(
    total / skills.length
  );
}

// ============================================================
// ADAPTIVE SUMMARY
// ============================================================

export function getAdaptiveSummary(
  progress: RISEProgress,
  goals: string[] = []
) {
  const normalized =
    normalizeProgress(progress);

  const primaryGoal =
    goals.length > 0
      ? normalizeGoal(
          goals[0]
        )
      : "personal";

  const skills =
    buildSkillTreeForGoal(
      primaryGoal,
      normalized
    );

  const recommendation =
    getNextRecommendation(
      normalized,
      primaryGoal
    );

  const currentSkill =
    getCurrentSkill(skills);

  const weakestSkill =
    getWeakestSkill(skills);

  const averageProgress =
    getGoalProgress(
      normalized,
      primaryGoal
    );

  let momentum =
    "Starting";

  if (averageProgress >= 80) {
    momentum = "Advanced";
  } else if (
    averageProgress >= 60
  ) {
    momentum = "Strong";
  } else if (
    averageProgress >= 35
  ) {
    momentum = "Building";
  }

  return {
    goalLabel:
      primaryGoal,

    focusLabel:
      currentSkill?.name ||
      "Getting Started",

    momentum,

    recommendation,

    currentLevel:
      normalized.level,

    totalXP:
      normalized.totalXP,

    coins:
      normalized.coins,

    streak:
      getStreak(normalized),

    weakestSkill:
      weakestSkill?.name ||
      "No skill data yet",

    adaptiveDifficulty:
      recommendation.difficulty ||
      "Easy",

    averageProgress,

    currentSkill,
  };
}

// ============================================================
// PROGRESS SUMMARY
// ============================================================

export function buildProgressSummary(
  progress: RISEProgress,
  goal?: string
) {
  const normalized =
    normalizeProgress(progress);

  const skills = goal
    ? buildSkillTreeForGoal(
        goal,
        normalized
      )
    : normalized.skills;

  const recommendation =
    getNextRecommendation(
      normalized,
      goal
    );

  return {
    totalXP:
      normalized.totalXP,

    level:
      normalized.level,

    currentLevelXP:
      getCurrentLevelXP(
        normalized.totalXP
      ),

    nextLevelXP:
      getXPForNextLevel(
        normalized.level
      ),

    coins:
      normalized.coins,

    streak:
      getStreak(normalized),

    skillCount:
      skills.length,

    averageSkillProgress:
      skills.length > 0
        ? Math.round(
            skills.reduce(
              (sum, skill) =>
                sum +
                getSkillProgress(
                  skill
                ),
              0
            ) /
              skills.length
          )
        : 0,

    currentSkill:
      getCurrentSkill(
        skills
      ),

    weakestSkill:
      getWeakestSkill(
        skills
      ),

    strongestSkill:
      getStrongestSkill(
        skills
      ),

    recommendation,

    achievements:
      getAchievements(
        normalized
      ),

    milestones:
      getMilestones(
        normalized
      ),
  };
}

// ============================================================
// EVENT HELPERS
// ============================================================

export function getEventsByType(
  progress: RISEProgress,
  type: XPEventType
): XPEvent[] {
  return progress.events.filter(
    (event) =>
      event.type === type
  );
}

export function getActivityCount(
  progress: RISEProgress
): number {
  return progress.events.length;
}

export function getXPByType(
  progress: RISEProgress,
  type: XPEventType
): number {
  return getEventsByType(
    progress,
    type
  ).reduce(
    (total, event) =>
      total + event.amount,
    0
  );
}

export function getMissionCount(
  progress: RISEProgress
): number {
  return getEventsByType(
    progress,
    "mission"
  ).length;
}

export function getProjectCount(
  progress: RISEProgress
): number {
  return getEventsByType(
    progress,
    "project"
  ).length;
}

export function getQuizCount(
  progress: RISEProgress
): number {
  return getEventsByType(
    progress,
    "quiz"
  ).length;
}

export function getLatestActivity(
  progress: RISEProgress
): XPEvent | null {
  if (!progress.events.length) {
    return null;
  }

  return progress.events[
    progress.events.length - 1
  ];
}

// ============================================================
// STORAGE
// ============================================================

export async function loadStoredProgress(): Promise<RISEProgress> {
  try {
    const stored =
      await AsyncStorage.getItem(
        STORAGE_KEY
      );

    if (!stored) {
      return createDefaultProgress();
    }

    const parsed =
      JSON.parse(stored);

    return normalizeProgress(
      parsed
    );
  } catch (error) {
    console.warn(
      "RISE: Failed to load progress",
      error
    );

    return createDefaultProgress();
  }
}

export async function saveStoredProgress(
  progress: RISEProgress
): Promise<void> {
  try {
    const normalized =
      normalizeProgress(
        progress
      );

    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        normalized
      )
    );
  } catch (error) {
    console.warn(
      "RISE: Failed to save progress",
      error
    );
    throw new Error("Your progress could not be saved. Please try again.");
  }
}

// ============================================================
// REPOSITORY
// ============================================================

export const progressRepository = {
  async load(): Promise<RISEProgress> {
    return loadStoredProgress();
  },

  async save(
    progress: RISEProgress
  ): Promise<void> {
    await saveStoredProgress(
      progress
    );
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.removeItem(
        STORAGE_KEY
      );
    } catch (error) {
      console.warn(
        "RISE: Failed to clear progress",
        error
      );
    }
  },
};

// ============================================================
// BACKWARD COMPATIBILITY
// ============================================================

export const DEFAULT_SKILLS =
  BASE_SKILL_TEMPLATES.map(
    (template) => ({
      ...template,
      xp: 0,
      level: 1,
      goal: "personal",
    })
  );
