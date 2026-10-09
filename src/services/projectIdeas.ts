export type ProjectDifficulty = "Easy" | "Medium" | "Hard" | "Insane";

export type ProjectIdeaLevel = {
  title: string;
  description: string;
  examples: string[];
};

type IdeaSet = Record<ProjectDifficulty, ProjectIdeaLevel>;

const namedIdeas: Record<string, [string[], string[], string[], string[]]> = {
  "software-engineer": [
    ["A responsive tip calculator", "A study timer that saves sessions", "A personal portfolio contact form"],
    ["A habit tracker with local storage", "A weather dashboard with loading and error states", "A searchable notes app"],
    ["A full-stack task manager with accounts", "A school event planner with a database", "A real-time study-room app"],
    ["A multi-user productivity product", "An accessible community resource platform", "A deployed app tested by 10 real users"],
  ],
  "ai-engineer": [
    ["A Python text classifier using sample data", "A prompt evaluator comparing three prompt versions", "A notebook that visualizes a small dataset"],
    ["A document question-answering prototype", "A recommendation tool with an evaluation set", "An image classifier with a confusion matrix"],
    ["An AI study coach with safety rules and tests", "A retrieval app with citations and evaluation", "A model-monitoring dashboard for failures"],
    ["A deployed AI product tested by real users", "An end-to-end model pipeline with monitoring", "A domain assistant with red-team and quality reports"],
  ],
  "aerospace-engineer": [
    ["A paper-airfoil experiment comparing lift", "A CAD model of a lightweight bracket", "A spreadsheet estimating a model rocket’s altitude"],
    ["A glider prototype tested across five flights", "A CAD assembly with a mass budget", "A Python orbital-motion visualization"],
    ["A sensor-based model rocket data logger", "A wind-tunnel-style test with documented results", "A flight-control simulation with test cases"],
    ["A complete small-aircraft design study", "A mission concept with requirements and trade analysis", "A prototype validated against engineering calculations"],
  ],
  entrepreneur: [
    ["Interview five people about one painful problem", "Create and test a one-page offer", "Pre-sell a simple service to one customer"],
    ["Build a landing page and collect 10 sign-ups", "Run a pricing test with three packages", "Deliver a manual first version to three customers"],
    ["Launch an MVP and measure weekly retention", "Build a repeatable sales pipeline", "Run a customer-feedback sprint and ship improvements"],
    ["Reach 25 active users with measured retention", "Build an operating dashboard and growth experiment", "Launch a revenue-generating version with customer support"],
  ],
  youtube: [
    ["Publish one 60-second tutorial with a clear hook", "Create three thumbnail-title pairs", "Rewrite the first 30 seconds of an old video"],
    ["Produce a 3–5 minute video and test two openings", "Create a three-video mini-series", "Interview one viewer and revise your format"],
    ["Publish a researched video with a retention plan", "Run a four-week content experiment", "Collaborate and compare audience results"],
    ["Launch a complete channel series with analytics", "Build a repeatable production system", "Grow a format using five measured experiments"],
  ],
  student: [
    ["Create a one-page active-recall guide", "Build 20 flashcards and test yourself", "Turn one chapter into a concept map"],
    ["Run a seven-day study experiment", "Build a practice exam and error log", "Create a revision dashboard for one subject"],
    ["Design and complete a full exam-prep system", "Teach a difficult unit in a recorded lesson", "Compare two study methods using quiz scores"],
    ["Build a reusable study system for a full course", "Create a peer study program and measure results", "Complete a research project with cited sources"],
  ],
  fitness: [
    ["Record and review form for three basic movements", "Complete a seven-day walking plan", "Build a safe 15-minute mobility routine"],
    ["Follow and measure a two-week strength plan", "Create a progressive running plan", "Track sleep, recovery, and training for 14 days"],
    ["Complete a four-week progressive program", "Improve one measured performance goal safely", "Design and test a balanced training week"],
    ["Complete an eight-week evidence-based program", "Prepare for a safe performance event", "Build a training log with measurable adaptations"],
  ],
  personal: [
    ["Build a distraction-free 25-minute focus routine", "Create a weekly reset checklist", "Practice one difficult conversation with a script"],
    ["Run a seven-day habit experiment", "Build a personal time-management dashboard", "Complete a confidence challenge with daily evidence"],
    ["Complete a 30-day personal improvement system", "Design and test a complete weekly routine", "Create a portfolio of ten visible personal wins"],
    ["Lead a real community improvement project", "Build a 90-day growth system with measurements", "Teach your proven improvement process to others"],
  ],
};

function labelFor(goal: string) {
  return goal.split("-").filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ") || "Personal Growth";
}

export function getProjectIdeaLevels(goal: string, focusSkill?: string): IdeaSet {
  const normalized = goal.trim().toLowerCase();
  const label = labelFor(normalized);
  const skill = focusSkill?.trim() || label;
  const ideas = namedIdeas[normalized] || [
    [`Create a one-page ${skill} field guide`, `Complete a 30-minute ${skill} before-and-after challenge`, `Make three examples that demonstrate ${skill}`],
    [`Build a useful ${skill} case study`, `Solve one real ${label.toLowerCase()} problem`, `Create a ${skill} result and improve it from feedback`],
    [`Ship a polished ${label} portfolio project`, `Complete a seven-day ${skill} sprint`, `Build and test a solution for a real person`],
    [`Launch a real-world ${label} project`, `Measure a 30-day ${skill} outcome`, `Create a solution used and reviewed by real people`],
  ];

  return {
    Easy: { title: `${skill}: quick visible win`, description: "Choose one guided idea, finish a small result today, and explain what improved.", examples: ideas[0] },
    Medium: { title: `${skill}: useful challenge`, description: "Build a practical result, test it once, and improve it using evidence.", examples: ideas[1] },
    Hard: { title: `${label}: portfolio project`, description: "Ship a polished outcome with planning, testing, feedback, and proof.", examples: ideas[2] },
    Insane: { title: `${label}: real-world impact`, description: "Launch a substantial result, measure real use, and document what changed.", examples: ideas[3] },
  };
}
