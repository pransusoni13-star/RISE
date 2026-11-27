import AsyncStorage from "@react-native-async-storage/async-storage";
import { loadSensitiveProfile, saveSensitiveProfile, SensitiveProfile } from "./sensitiveStorage";
import { getCloudProfile, syncUserProfile } from "./auth";

import { fallbackProfile } from "./missionPlanner";
import type { RiseProfile } from "./missionPlanner";
export const PERSONALIZATION_KEY = "RISE_PERSONALIZATION";
export { createSevenDayPlan, getRecommendedSkills, goalTrack, minutesForTime, parseMissionPayload } from "./missionPlanner";
export type { RiseProfile, PersonalizedMission } from "./missionPlanner";

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
          ? safeSaved.selectedGoals.slice(0, 64)
          : fallbackProfile.selectedGoals,
    };
  } catch {
    return fallbackProfile;
  }
}

export async function hasSavedProfile(): Promise<boolean> {
  try {
    return Boolean(await AsyncStorage.getItem(PERSONALIZATION_KEY));
  } catch {
    return false;
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

/** Restores non-sensitive plan fields after sign-in without uploading faith or private context. */
export async function hydrateProfileFromCloud(): Promise<RiseProfile> {
  const local = await loadProfile();
  const cloud = await getCloudProfile();
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
  await AsyncStorage.setItem(PERSONALIZATION_KEY, JSON.stringify(hydrated));
  return hydrated;
}

export async function updateProfile(
  changes: Partial<RiseProfile>
): Promise<RiseProfile> {
  const current = await loadProfile();
  const next = { ...current, ...changes };
  await saveProfile(next);
  return next;
}
