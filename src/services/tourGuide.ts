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
    eyebrow: "1 · TODAY",
    title: "Start with one mission.",
    description: "Today shows the one action that matters now.",
    previewTitle: "TODAY’S MISSION",
    previewRows: ["See the outcome", "Check the time", "Tap Start"],
    destination: "Today tab",
    destinationRoute: "/(tabs)/today",
  },
  {
    eyebrow: "2 · LEARN",
    title: "Learn only what helps.",
    description: "Get one useful idea, then apply it to your mission.",
    previewTitle: "TODAY’S SKILL",
    previewRows: ["Open one trusted guide", "Check your understanding", "Use it now"],
    destination: "Learn tab",
    destinationRoute: "/(tabs)/learn",
  },
  {
    eyebrow: "3 · FINISH",
    title: "Prove the real work.",
    description: "Finish every step, reflect, and add evidence.",
    previewTitle: "TO CLAIM THE WIN",
    previewRows: ["Finish each action", "Write two sentences", "Attach proof"],
    destination: "Missions tab",
    destinationRoute: "/(tabs)/missions",
  },
  {
    eyebrow: "4 · RISE",
    title: "Return stronger tomorrow.",
    description: "Your work is saved. Tomorrow unlocks the next mission.",
    previewTitle: "AFTER YOU FINISH",
    previewRows: ["Your progress saves", "Today shows complete", "Tomorrow opens next"],
    destination: "Progress tab",
    destinationRoute: "/(tabs)/progress",
  },
];

