import AsyncStorage from "@react-native-async-storage/async-storage";
import { deleteSensitiveProfile, loadSensitiveProfile, SENSITIVE_PROFILE_KEY } from "./sensitiveStorage";

const RISE_STORAGE_PREFIX = "RISE_";

export type RiseDataExport = {
  exportedAt: string;
  formatVersion: 1;
  records: Record<string, unknown>;
};

/** Builds a portable snapshot of RISE-owned records without uploading it. */
export async function createRiseDataExport(): Promise<RiseDataExport> {
  const keys = (await AsyncStorage.getAllKeys())
    .filter((key) => key.startsWith(RISE_STORAGE_PREFIX))
    .sort();
  const storedValues = keys.length > 0 ? await AsyncStorage.multiGet(keys) : [];
  const records: Record<string, unknown> = Object.fromEntries(storedValues.map(([key, value]) => {
    if (value === null) return [key, null];

    try {
      return [key, JSON.parse(value)];
    } catch {
      return [key, value];
    }
  }));
  const sensitiveProfile = await loadSensitiveProfile();
  if (Object.keys(sensitiveProfile).length > 0) {
    records[SENSITIVE_PROFILE_KEY] = sensitiveProfile;
  }

  return {
    exportedAt: new Date().toISOString(),
    formatVersion: 1,
    records,
  };
}

/** Removes all RISE-owned local data without touching Expo or library data. */
export async function deleteAllRiseData(): Promise<number> {
  const keys = await AsyncStorage.getAllKeys();
  const riseKeys = keys.filter((key) => key.startsWith(RISE_STORAGE_PREFIX));

  if (riseKeys.length > 0) {
    await AsyncStorage.multiRemove(riseKeys);
  }

  const deletedSensitiveProfile = await deleteSensitiveProfile();
  return riseKeys.length + (deletedSensitiveProfile ? 1 : 0);
}
