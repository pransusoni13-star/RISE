import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

export const SENSITIVE_PROFILE_KEY = "RISE_SENSITIVE_PROFILE";

export type SensitiveProfile = {
  spiritualTradition?: string;
  trustedSources?: string;
};

let webSessionValue: SensitiveProfile = {};

function normalize(value: SensitiveProfile): SensitiveProfile {
  if (!value || typeof value !== "object" || Array.isArray(value)
    || [value.spiritualTradition, value.trustedSources].some(item => item !== undefined && typeof item !== "string")) {
    throw new Error("Protected preferences could not be read. They have not been replaced.");
  }
  const spiritualTradition = value.spiritualTradition?.trim().slice(0, 80);
  const trustedSources = value.trustedSources?.trim().slice(0, 300);
  return {
    ...(spiritualTradition ? { spiritualTradition } : {}),
    ...(trustedSources ? { trustedSources } : {}),
  };
}

export async function loadSensitiveProfile(): Promise<SensitiveProfile> {
  if (Platform.OS === "web") return webSessionValue;

  const raw = await SecureStore.getItemAsync(SENSITIVE_PROFILE_KEY);
  return raw === null ? {} : normalize(JSON.parse(raw) as SensitiveProfile);
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
  const hadValue = Platform.OS === "web"
    ? Object.keys(webSessionValue).length > 0
    : (await SecureStore.getItemAsync(SENSITIVE_PROFILE_KEY)) !== null;
  webSessionValue = {};
  if (Platform.OS !== "web") {
    await SecureStore.deleteItemAsync(SENSITIVE_PROFILE_KEY);
  }
  return hadValue;
}
