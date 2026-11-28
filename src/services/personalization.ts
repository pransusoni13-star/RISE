import AsyncStorage from "@react-native-async-storage/async-storage";
import { loadSensitiveProfile, saveSensitiveProfile, SensitiveProfile } from "./sensitiveStorage";
import { getCloudProfile, syncUserProfile } from "./auth";

import { fallbackProfile } from "./missionPlanner";
import type { RiseProfile } from "./missionPlanner";
import { createSerializedMutationQueue } from "./serializedMutations";

const runProfileMutation = createSerializedMutationQueue();
export const PERSONALIZATION_KEY = "RISE_PERSONALIZATION";
export { createSevenDayPlan, getRecommendedSkills, goalTrack, minutesForTime, parseMissionPayload } from "./missionPlanner";
export type { RiseProfile, PersonalizedMission } from "./missionPlanner";

async function readProfile(): Promise<RiseProfile> {
  const raw = await AsyncStorage.getItem(PERSONALIZATION_KEY);
  const saved = raw === null ? {} : JSON.parse(raw) as Partial<RiseProfile>;
  if (!saved || typeof saved !== "object" || Array.isArray(saved)) throw new Error("Saved plan could not be read. It has not been replaced.");
  if (raw !== null && !["selectedGoals", "customGoal", "weeklySkill"].some(key => Object.hasOwn(saved,key))) throw new Error("Saved plan needs recovery. It has not been replaced.");
  if ([saved.selectedGoals,saved.focusSkills,saved.cycleBadges].some(items => items !== undefined && (!Array.isArray(items) || !items.every(item => typeof item === "string")))) throw new Error("Saved plan contains unreadable choices. It has not been replaced.");
  if ([saved.customGoal,saved.weeklySkill,saved.currentSituation,saved.experience,saved.availableTime,saved.accountability,saved.commitment,saved.skillStartDate].some(value => value !== undefined && typeof value !== "string")) throw new Error("Saved plan contains unreadable fields. It has not been replaced.");
  if(saved.practiceCycle!==undefined && (!Number.isSafeInteger(saved.practiceCycle) || saved.practiceCycle<1)) throw new Error("Saved practice cycle could not be read. It has not been replaced.");
  const legacySensitive: SensitiveProfile = {
    spiritualTradition: saved.spiritualTradition,
    trustedSources: saved.trustedSources,
  };
  const safeSaved = { ...saved };
  delete safeSaved.spiritualTradition;
  delete safeSaved.trustedSources;
  const protectedSensitive = await loadSensitiveProfile();
  const sensitive = {...legacySensitive, ...protectedSensitive};

  if (saved.spiritualTradition || saved.trustedSources) {
    await saveSensitiveProfile(sensitive);
    await AsyncStorage.setItem(PERSONALIZATION_KEY, JSON.stringify(safeSaved));
  }

  return {
    ...fallbackProfile,
    ...safeSaved,
    ...sensitive,
    selectedGoals:
      Array.isArray(safeSaved.selectedGoals) && safeSaved.selectedGoals.length
        ? safeSaved.selectedGoals.slice(0, 64)
        : fallbackProfile.selectedGoals,
  };
}

export function loadProfile(): Promise<RiseProfile> {
  return runProfileMutation(readProfile);
}

export async function hasSavedProfile(): Promise<boolean> {
  return (await AsyncStorage.getItem(PERSONALIZATION_KEY)) !== null;
}

async function writeProfileLocally(profile: RiseProfile): Promise<void> {
  const { spiritualTradition, trustedSources, ...safeProfile } = profile;
  await saveSensitiveProfile({ spiritualTradition, trustedSources });
  await AsyncStorage.setItem(PERSONALIZATION_KEY, JSON.stringify(safeProfile));
}

export async function saveProfile(profile: RiseProfile): Promise<void> {
  return runProfileMutation(async () => {
    await writeProfileLocally(profile);
    await syncUserProfile(profile).catch(() => undefined);
  });
}

/** Restores non-sensitive plan fields after sign-in without uploading faith or private context. */
export async function hydrateProfileFromCloud(): Promise<RiseProfile> {
  const cloud = await getCloudProfile();
  return runProfileMutation(async () => {
    const local = await readProfile();
    if (!cloud) return local;
    const hydrated: RiseProfile = {
      ...local,
      selectedGoals: cloud.selected_goals.length ? cloud.selected_goals.slice(0, 64) : local.selectedGoals,
      customGoal: cloud.custom_goal || local.customGoal,
      weeklySkill: cloud.weekly_skill || local.weeklySkill,
      focusSkills: cloud.focus_skills.length ? cloud.focus_skills.slice(0, 3) : local.focusSkills,
      commitment: cloud.commitment || local.commitment,
      availableTime: cloud.available_time || local.availableTime,
      experience: cloud.experience || local.experience,
    };
    await writeProfileLocally(hydrated);
    return hydrated;
  });
}

export async function updateProfile(
  changes: Partial<RiseProfile>
): Promise<RiseProfile> {
  return runProfileMutation(async () => {
    const current = await readProfile();
    const next = { ...current, ...changes };
    await writeProfileLocally(next);
    await syncUserProfile(next).catch(() => undefined);
    return next;
  });
}
