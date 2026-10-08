import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const KEY = "RISE_DAILY_REMINDER";
const CHANNEL = "rise-daily-check-in";

export type ReminderTime = "08:00" | "12:00" | "18:00" | "20:00";
export type ReminderState = {
  enabled: boolean;
  time: ReminderTime;
  times: ReminderTime[];
  permission: "granted" | "denied" | "not_requested" | "unavailable";
};

type StoredReminder = { enabled: boolean; time: ReminderTime; times: ReminderTime[]; id?: string; ids: string[] };

const validTimes: ReminderTime[] = ["08:00", "12:00", "18:00", "20:00"];

async function readStored(): Promise<StoredReminder> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) as Partial<StoredReminder> : null;
    const legacyTime = validTimes.includes(parsed?.time as ReminderTime) ? parsed!.time! : "20:00";
    const times = Array.isArray(parsed?.times)
      ? Array.from(new Set(parsed.times.filter((time): time is ReminderTime => validTimes.includes(time as ReminderTime))))
      : [legacyTime];
    return {
      enabled: parsed?.enabled === true,
      time: times[0] || legacyTime,
      times: times.length ? times : [legacyTime],
      id: typeof parsed?.id === "string" ? parsed.id : undefined,
      ids: Array.isArray(parsed?.ids) ? parsed.ids.filter((id): id is string => typeof id === "string") : (typeof parsed?.id === "string" ? [parsed.id] : []),
    };
  } catch {
    return { enabled: false, time: "20:00", times: ["20:00"], ids: [] };
  }
}

async function notifications() {
  return import("expo-notifications");
}

export async function getReminderState(): Promise<ReminderState> {
  const saved = await readStored();
  if (Platform.OS === "web") return { enabled: false, time: saved.time, times: saved.times, permission: "unavailable" };
  try {
    const api = await notifications();
    const permission = await api.getPermissionsAsync();
    const granted = permission.granted || permission.ios?.status === api.IosAuthorizationStatus.PROVISIONAL;
    if (!granted) return { enabled: false, time: saved.time, times: saved.times, permission: permission.canAskAgain ? "not_requested" : "denied" };
    const activeIds = new Set((await api.getAllScheduledNotificationsAsync()).map((item) => item.identifier));
    const scheduled = saved.ids.length > 0 && saved.ids.every((id) => activeIds.has(id));
    return { enabled: saved.enabled && scheduled, time: saved.time, times: saved.times, permission: "granted" };
  } catch {
    return { enabled: false, time: saved.time, times: saved.times, permission: "unavailable" };
  }
}

export async function setDailyReminder(enabled: boolean, time: ReminderTime): Promise<ReminderState> {
  return setDailyReminders(enabled, [time]);
}

export async function setDailyReminders(enabled: boolean, requestedTimes: ReminderTime[]): Promise<ReminderState> {
  const saved = await readStored();
  const times = Array.from(new Set(requestedTimes.filter((time) => validTimes.includes(time)))).slice(0, 3);
  const selectedTimes = times.length ? times : ["20:00" as ReminderTime];
  const time = selectedTimes[0];
  if (Platform.OS === "web") return { enabled: false, time, times: selectedTimes, permission: "unavailable" };
  const api = await notifications();
  if (!enabled) {
    await Promise.all(saved.ids.map((id) => api.cancelScheduledNotificationAsync(id)));
    await AsyncStorage.setItem(KEY, JSON.stringify({ enabled: false, time, times: selectedTimes, ids: [] }));
    return getReminderState();
  }

  if (Platform.OS === "android") {
    await api.setNotificationChannelAsync(CHANNEL, {
      name: "Daily check-in",
      importance: api.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 150, 250],
    });
  }
  let permission = await api.getPermissionsAsync();
  if (!permission.granted && permission.ios?.status !== api.IosAuthorizationStatus.PROVISIONAL) {
    permission = await api.requestPermissionsAsync();
  }
  if (!permission.granted && permission.ios?.status !== api.IosAuthorizationStatus.PROVISIONAL) {
    await AsyncStorage.setItem(KEY, JSON.stringify({ enabled: false, time, times: selectedTimes, ids: [] }));
    return { enabled: false, time, times: selectedTimes, permission: "denied" };
  }

  // Schedule the replacement first so a failure never silently removes the old reminder.
  const ids: string[] = [];
  try {
    for (const selectedTime of selectedTimes) {
      const [hour, minute] = selectedTime.split(":").map(Number);
      ids.push(await api.scheduleNotificationAsync({
        content: {
          title: "Your RISE check-in",
          body: "Protect your 1%: finish today’s mission to earn XP and coins.",
          sound: "default",
          data: { url: "/(tabs)/today" },
        },
        trigger: { type: api.SchedulableTriggerInputTypes.DAILY, hour, minute, ...(Platform.OS === "android" ? { channelId: CHANNEL } : {}) },
      }));
    }
    await AsyncStorage.setItem(KEY, JSON.stringify({ enabled: true, time, times: selectedTimes, ids }));
  } catch (error) {
    // Do not leave an untracked duplicate notification after a failed save.
    await Promise.all(ids.map((id) => api.cancelScheduledNotificationAsync(id)));
    throw error;
  }
  await Promise.all(saved.ids.filter((id) => !ids.includes(id)).map((id) => api.cancelScheduledNotificationAsync(id)));
  return { enabled: true, time, times: selectedTimes, permission: "granted" };
}

export async function cancelDailyReminder(): Promise<void> {
  const saved = await readStored();
  if (Platform.OS !== "web" && saved.ids.length) {
    const api = await notifications();
    await Promise.all(saved.ids.map((id) => api.cancelScheduledNotificationAsync(id)));
  }
  await AsyncStorage.removeItem(KEY);
}

export async function initializeReminderNavigation(onOpen: () => void): Promise<() => void> {
  if (Platform.OS === "web") return () => undefined;
  const api = await notifications();
  api.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
  });
  const subscription = api.addNotificationResponseReceivedListener((response) => {
    if (response.notification.request.content.data?.url === "/(tabs)/today") onOpen();
  });
  const last = await api.getLastNotificationResponseAsync();
  if (last?.notification.request.content.data?.url === "/(tabs)/today") onOpen();
  return () => subscription.remove();
}
