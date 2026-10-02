import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "RISE_CLOUD_SYNC_OUTBOX";
// At the API's 2 KB metadata ceiling this remains a bounded, device-local queue
// while leaving enough room for a long offline learning cycle.
const MAX_ITEMS = 1000;

export type QueuedProfile = {
  selected_goals: string[];
  custom_goal: string;
  weekly_skill: string;
  focus_skills: string[];
  commitment: string;
  available_time: string;
  experience: string;
};

export type QueuedProgressEvent = {
  client_event_id: string;
  event_type: "skill_selected" | "mission_completed" | "quiz_completed" | "reflection_completed" | "app_session";
  skill_slug: string;
  value: number;
  minutes: number;
  metadata: Record<string, unknown>;
};

export type SyncOutboxItem =
  | { id: "profile:latest"; kind: "profile"; createdAt: string; payload: QueuedProfile }
  | { id: string; kind: "event"; createdAt: string; payload: QueuedProgressEvent };

async function read(): Promise<SyncOutboxItem[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item) => item && typeof item.id === "string") : [];
  } catch {
    return [];
  }
}

async function write(items: SyncOutboxItem[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(-MAX_ITEMS)));
}

export async function queueProfile(payload: QueuedProfile): Promise<void> {
  const items: SyncOutboxItem[] = (await read()).filter((item) => item.kind !== "profile");
  items.push({ id: "profile:latest", kind: "profile", createdAt: new Date().toISOString(), payload });
  await write(items);
}

export async function queueProgressEvent(payload: QueuedProgressEvent): Promise<void> {
  const id = `event:${payload.client_event_id}`;
  const items = await read();
  if (!items.some((item) => item.id === id)) {
    items.push({ id, kind: "event", createdAt: new Date().toISOString(), payload });
    await write(items);
  }
}

export async function listSyncOutbox(): Promise<SyncOutboxItem[]> {
  return read();
}

export async function removeSyncOutboxItem(id: string): Promise<void> {
  await write((await read()).filter((item) => item.id !== id));
}

export async function discardQueuedUsageAnalytics(): Promise<void> {
  await write((await read()).filter((item) => item.kind !== "event" || item.payload.event_type !== "app_session"));
}

export async function getPendingSyncCount(): Promise<number> {
  return (await read()).length;
}
