import { getRecommendedSkills, type RiseProfile } from "./missionPlanner";

export const QUICK_START_GOALS = [
  {
    id: "study",
    label: "Study better",
    detail: "Remember what you learn",
    goal: "student",
    title: "Study with more focus",
    mark: "Aa",
  },
  {
    id: "coding",
    label: "Build something",
    detail: "Practise a coding skill",
    goal: "software-engineer",
    title: "Learn to build software",
    mark: "</>",
  },
  {
    id: "music",
    label: "Make music",
    detail: "A little practice, often",
    goal: "music",
    title: "Improve my music skills",
    mark: "♪",
  },
  {
    id: "fitness",
    label: "Move more",
    detail: "Comfortable, gentle practice",
    goal: "fitness",
    title: "Build a comfortable movement habit",
    mark: "↗",
  },
  {
    id: "creative",
    label: "Get creative",
    detail: "Try a photography exercise",
    goal: "photography",
    title: "Improve my photography",
    mark: "◈",
  },
  {
    id: "custom",
    label: "My own goal",
    detail: "Tell us in your own words",
    goal: "custom-life",
    title: "",
    mark: "+",
  },
] as const;

export function quickStartProfile(
  id: string,
  minutes: number,
  customGoal = "",
  now = new Date().toISOString(),
): Partial<RiseProfile> {
  const choice = QUICK_START_GOALS.find((option) => option.id === id);
  if (!choice || ![5, 10, 20].includes(minutes))
    throw new Error("Choose a goal and a time to start.");
  const goal =
    id === "custom" ? customGoal.trim().replace(/\s+/g, " ") : choice.title;
  if (goal.length < 3 || goal.length > 200)
    throw new Error("Describe your goal in 3–200 characters.");
  if (!Number.isFinite(Date.parse(now)))
    throw new Error("The start date could not be read.");
  const skills =
    id === "coding" ? ["Programming"] : getRecommendedSkills(choice.goal, goal);
  return {
    selectedGoals: [choice.goal],
    customGoal: goal,
    weeklySkill: skills[0],
    focusSkills: skills.slice(0, 1),
    availableTime: `${minutes} minutes`,
    commitment: "Every 7 days",
    experience: "Complete beginner",
    skillStartDate: now,
    planIdentityVersion: 2,
    practiceCycle: 1,
    lastDifficultyFeedback: undefined,
    lastMissionUseful: undefined,
    lastBlocker: minutes === 5 ? "time" : undefined,
  };
}
