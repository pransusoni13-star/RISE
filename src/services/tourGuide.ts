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
    eyebrow: "YOUR 20-SECOND START",
    title: "One mission. One real win.",
    description: "RISE gives you one useful action now, then saves the proof of your progress.",
    previewTitle: "EVERY DAY, DO THIS",
    previewRows: ["Open Today", "Finish the mission", "Reflect and add proof"],
    destination: "Today tab",
    destinationRoute: "/(tabs)/today",
  },
];

