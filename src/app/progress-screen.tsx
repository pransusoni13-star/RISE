import {
  RISEProgress,
  createDefaultProgress,
  getXPForNextLevel,
  getCurrentLevelXP,
  getNextRecommendation,
  getAdaptiveSummary,
  buildSkillTreeForGoal,
  getSkillProgress,
  progressRepository,
} from "../services/progressEngine";
import { Redirect } from "expo-router";

export default function ProgressScreenRedirect() {
  return <Redirect href="/(tabs)/progress" />;
}
