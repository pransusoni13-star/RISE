import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const KEY = "RISE_DAILY_REMINDER";
const CHANNEL = "rise-daily-check-in";

export type ReminderTime = "08:00" | "12:00" | "18:00" | "20:00";
export type ReminderState = {
  enabled: boolean;
  time: ReminderTime;
  permission: "granted" | "denied" | "not_requested" | "unavailable";
};

type StoredReminder = { enabled: boolean; time: ReminderTime; id?: string };

const validTimes: ReminderTime[] = ["08:00", "12:00", "18:00", "20:00"];

async function readStored(): Promise<StoredReminder> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) as Partial<StoredReminder> : null;
    return {
      enabled: parsed?.enabled === true,
      time: validTimes.includes(parsed?.time as ReminderTime) ? parsed!.time! : "20:00",
      id: typeof parsed?.id === "string" ? parsed.id : undefined,
    };
  } catch {
    return { enabled: false, time: "20:00" };
  }
}

async function notifications() {
  return import("expo-notifications");
}

export async function getReminderState(): Promise<ReminderState> {
  const saved = await readStored();
  if (Platform.OS === "web") return { enabled: false, time: saved.time, permission: "unavailable" };
  try {
    const api = await notifications();
    const permission = await api.getPermissionsAsync();
    const granted = permission.granted || permission.ios?.status === api.IosAuthorizationStatus.PROVISIONAL;
    if (!granted) return { enabled: false, time: saved.time, permission: permission.canAskAgain ? "not_requested" : "denied" };
    const scheduled = saved.id && (await api.getAllScheduledNotificationsAsync()).some((item) => item.identifier === saved.id);
    return { enabled: saved.enabled && Boolean(scheduled), time: saved.time, permission: "granted" };
  } catch {
    return { enabled: false, time: saved.time, permission: "unavailable" };
  }
}

export async function setDailyReminder(enabled: boolean, time: ReminderTime): Promise<ReminderState> {
  const saved = await readStored();
  if (Platform.OS === "web") return { enabled: false, time, permission: "unavailable" };
  const api = await notifications();
  if (!enabled) {
    if (saved.id) await api.cancelScheduledNotificationAsync(saved.id);
    await AsyncStorage.setItem(KEY, JSON.stringify({ enabled: false, time }));
    return getReminderState();
  }

  if (Platform.OS === "android") {
    await api.setNotificationChannelAsync(CHANNEL, {
      name: "Daily check-in",
      importance: api.AndroidImportance.DEFAULT,
    });
  }
  let permission = await api.getPermissionsAsync();
  if (!permission.granted && permission.ios?.status !== api.IosAuthorizationStatus.PROVISIONAL) {
    permission = await api.requestPermissionsAsync();
  }
  if (!permission.granted && permission.ios?.status !== api.IosAuthorizationStatus.PROVISIONAL) {
    await AsyncStorage.setItem(KEY, JSON.stringify({ enabled: false, time }));
    return { enabled: false, time, permission: "denied" };
  }

  const [hour, minute] = time.split(":").map(Number);
  // Schedule the replacement first so a failure never silently removes the old reminder.
  const id = await api.scheduleNotificationAsync({
    content: {
      title: "Your RISE check-in",
      body: "A small step counts. Open RISE to see your next mission.",
      data: { url: "/(tabs)/today" },
    },
    trigger: { type: api.SchedulableTriggerInputTypes.DAILY, hour, minute, ...(Platform.OS === "android" ? { channelId: CHANNEL } : {}) },
  });
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify({ enabled: true, time, id }));
  } catch (error) {
    // Do not leave an untracked duplicate notification after a failed save.
    await api.cancelScheduledNotificationAsync(id);
    throw error;
  }
  if (saved.id && saved.id !== id) await api.cancelScheduledNotificationAsync(saved.id);
  return { enabled: true, time, permission: "granted" };
}

export async function cancelDailyReminder(): Promise<void> {
  const saved = await readStored();
  if (Platform.OS !== "web" && saved.id) {
    const api = await notifications();
    await api.cancelScheduledNotificationAsync(saved.id);
  }
  await AsyncStorage.removeItem(KEY);
}

export async function initializeReminderNavigation(onOpen: () => void): Promise<() => void> {
  if (Platform.OS === "web") return () => undefined;
  const api = await notifications();
  api.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
  });
  const subscription = api.addNotificationResponseReceivedListener((response) => {
    if (response.notification.request.content.data?.url === "/(tabs)/today") onOpen();
  });
  const last = await api.getLastNotificationResponseAsync();
  if (last?.notification.request.content.data?.url === "/(tabs)/today") onOpen();
  return () => subscription.remove();
}
