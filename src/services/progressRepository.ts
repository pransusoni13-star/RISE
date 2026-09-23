import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  RISEProgress,
  createDefaultProgress,
  normalizeProgress,
} from "./progressEngine";

const STORAGE_KEY = "RISE_PROGRESS";

export interface ProgressRepository {
  load(): Promise<RISEProgress>;
  save(progress: RISEProgress): Promise<RISEProgress>;
  clear(): Promise<void>;
}

export function createProgressRepository(): ProgressRepository {
  return {
    async load() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);

        if (!saved) {
          return createDefaultProgress();
        }

        const parsed = JSON.parse(saved) as Partial<RISEProgress>;
        return normalizeProgress(parsed);
      } catch (error) {
        console.log("Failed to load stored progress:", error);
        return createDefaultProgress();
      }
    },

    async save(progress) {
      try {
        const normalized = normalizeProgress(progress);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
        return normalized;
      } catch (error) {
        console.log("Failed to save stored progress:", error);
        throw new Error("Your progress could not be saved. Please try again before leaving this screen.");
      }
    },

    async clear() {
      await AsyncStorage.removeItem(STORAGE_KEY);
    },
  };
}

export const progressRepository = createProgressRepository();
