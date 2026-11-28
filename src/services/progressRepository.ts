import {
  RISEProgress,
  progressRepository as sharedRepository,
  normalizeProgress,
} from "./progressEngine";

export interface ProgressRepository {
  load(): Promise<RISEProgress>;
  save(progress: RISEProgress): Promise<RISEProgress>;
  clear(): Promise<void>;
  update(change: (current: RISEProgress) => RISEProgress): Promise<RISEProgress>;
}

export function createProgressRepository(): ProgressRepository {
  return {
    async load() {
      return sharedRepository.load();
    },

    async save(progress) {
      await sharedRepository.save(progress);
      return normalizeProgress(progress);
    },

    async clear() {
      await sharedRepository.clear();
    },
    update: sharedRepository.update,
  };
}

export const progressRepository = createProgressRepository();
