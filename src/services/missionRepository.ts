import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "RISE_MISSION_RECORDS";

export type MissionStatus =
  | "not_started"
  | "in_progress"
  | "proof_required"
  | "proof_submitted"
  | "completed";

export type ProofMetadata = {
  uri: string;
  type: "photo" | "video";
  missionId: string;
  submittedAt: string;
  description?: string;
  review?: {
    passed: boolean;
    checkedAt: string;
    checks: Array<{ id: string; label: string; passed: boolean; detail: string }>;
  };
};

export type MissionFeedback = {
  difficulty?: "too_easy" | "right" | "too_hard";
  useful?: boolean;
  blocker?: "time" | "instructions" | "tools" | "confidence" | "none";
  submittedAt: string;
};

export type MissionRecord = {
  missionId: string;
  status: MissionStatus;
  completedSteps: number[];
  reflection?: string;
  proof?: ProofMetadata;
  startedAt?: string;
  completedAt?: string;
  feedback?: MissionFeedback;
};

async function loadAll(): Promise<Record<string, MissionRecord>> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function saveAll(records: Record<string, MissionRecord>) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export const missionRepository = {
  async get(missionId: string): Promise<MissionRecord> {
    const records = await loadAll();
    return records[missionId] || {
      missionId,
      status: "not_started",
      completedSteps: [],
    };
  },

  async list(): Promise<MissionRecord[]> {
    return Object.values(await loadAll());
  },

  async patch(missionId: string, changes: Partial<MissionRecord>): Promise<MissionRecord> {
    const records = await loadAll();
    const current = records[missionId] || {
      missionId,
      status: "not_started" as MissionStatus,
      completedSteps: [],
    };
    const next = { ...current, ...changes, missionId };
    records[missionId] = next;
    await saveAll(records);
    return next;
  },
};
