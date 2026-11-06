import Constants from "expo-constants";
import * as Updates from "expo-updates";
import { Platform } from "react-native";

export type RiseUpdateCheckResult =
  | { status: "current" }
  | { status: "ready" }
  | { status: "unavailable" };

export type RiseReleaseInfo = {
  version: string;
  build: string;
  channel: string;
  updateId: string | null;
};

export function getRiseReleaseInfo(): RiseReleaseInfo {
  return {
    version: Constants.expoConfig?.version || "1.0.0",
    build: Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode?.toString() || "development",
    channel: Updates.channel || "development",
    updateId: Updates.updateId,
  };
}

export async function checkAndDownloadRiseUpdate(): Promise<RiseUpdateCheckResult> {
  if (Platform.OS === "web" || !Updates.isEnabled) return { status: "unavailable" };
  const check = await Updates.checkForUpdateAsync();
  if (!check.isAvailable && !check.isRollBackToEmbedded) return { status: "current" };
  const fetched = await Updates.fetchUpdateAsync();
  return fetched.isNew || fetched.isRollBackToEmbedded ? { status: "ready" } : { status: "current" };
}

export async function applyDownloadedRiseUpdate(): Promise<void> {
  await Updates.reloadAsync();
}
