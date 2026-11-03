export type TourStep = {
  eyebrow: string;
  title: string;
  description: string;
  previewTitle: string;
  previewRows: string[];
  destination: string;
  destinationRoute: string;
};

export const TOUR_STEPS: TourStep[] = [
  {
    eyebrow: "STEP 1 · TODAY",
    title: "Do one mission today.",
    description: "Today shows the single action that matters now—no searching or guessing.",
    previewTitle: "START YOUR DAILY LOOP",
    previewRows: ["Open Today", "Start the mission", "Follow the next action"],
    destination: "Today tab",
    destinationRoute: "/(tabs)/today",
  },
  {
    eyebrow: "STEP 2 · LEARN",
    title: "Learn only what helps.",
    description: "Use the short guide, example, and quiz to understand today’s skill.",
    previewTitle: "BUILD THE SKILL",
    previewRows: ["Read the quick guide", "Study the worked example", "Take the quiz when ready"],
    destination: "Learn tab",
    destinationRoute: "/(tabs)/learn",
  },
  {
    eyebrow: "STEP 3 · PROVE",
    title: "Prove the work. Save the win.",
    description: "Add evidence and a short reflection so your progress is real and saved.",
    previewTitle: "COMPLETE THE MISSION",
    previewRows: ["Add photo or text proof", "Write the short reflection", "Finish once to earn XP"],
    destination: "Proof screen",
    destinationRoute: "/proof",
  },
  {
    eyebrow: "STEP 4 · PROGRESS",
    title: "See your growth build.",
    description: "Progress keeps your completed work, streak, XP, and next milestone visible.",
    previewTitle: "KNOW WHAT CHANGED",
    previewRows: ["Review XP and streak", "See completed missions", "Return tomorrow for the next day"],
    destination: "Progress tab",
    destinationRoute: "/(tabs)/progress",
  },
  {
    eyebrow: "STEP 5 · YOUR RISE",
    title: "Make RISE fit you.",
    description: "Use Plan to change direction and Settings for reminders, theme, tour, and feedback.",
    previewTitle: "STAY IN CONTROL",
    previewRows: ["Change your plan", "Set reminders and appearance", "Replay the tour or send feedback"],
    destination: "Settings screen",
    destinationRoute: "/settings",
  },
];

