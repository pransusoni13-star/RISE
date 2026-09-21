import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

export const SENSITIVE_PROFILE_KEY = "RISE_SENSITIVE_PROFILE";

export type SensitiveProfile = {
  spiritualTradition?: string;
  trustedSources?: string;
};

let webSessionValue: SensitiveProfile = {};

function normalize(value: SensitiveProfile): SensitiveProfile {
  const spiritualTradition = value.spiritualTradition?.trim().slice(0, 80);
  const trustedSources = value.trustedSources?.trim().slice(0, 300);
  return {
    ...(spiritualTradition ? { spiritualTradition } : {}),
    ...(trustedSources ? { trustedSources } : {}),
  };
}

export async function loadSensitiveProfile(): Promise<SensitiveProfile> {
  if (Platform.OS === "web") return webSessionValue;

  try {
    const raw = await SecureStore.getItemAsync(SENSITIVE_PROFILE_KEY);
    return raw ? normalize(JSON.parse(raw) as SensitiveProfile) : {};
  } catch {
    return {};
  }
}

export async function saveSensitiveProfile(value: SensitiveProfile): Promise<void> {
  const normalized = normalize(value);
  if (Platform.OS === "web") {
    webSessionValue = normalized;
    return;
  }

  if (Object.keys(normalized).length === 0) {
    await SecureStore.deleteItemAsync(SENSITIVE_PROFILE_KEY);
    return;
  }
  await SecureStore.setItemAsync(SENSITIVE_PROFILE_KEY, JSON.stringify(normalized), {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function deleteSensitiveProfile(): Promise<boolean> {
  const hadValue = Object.keys(await loadSensitiveProfile()).length > 0;
  webSessionValue = {};
  if (Platform.OS !== "web") {
    await SecureStore.deleteItemAsync(SENSITIVE_PROFILE_KEY);
  }
  return hadValue;
}
