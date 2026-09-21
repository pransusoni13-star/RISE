import "@/global.css";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { AppState } from "react-native";
import { getUsageAnalyticsConsent, getUsageAnalyticsEnabledAt, isUsageAnalyticsEnabled, recordProgressEvent } from "../services/auth";

export default function RootLayout() {
  useEffect(() => {
    void getUsageAnalyticsConsent();
    let activeSince = AppState.currentState === "active" ? Date.now() : 0;
    const recordElapsed = () => {
      if (!activeSince) return;
      if (!isUsageAnalyticsEnabled()) { activeSince = Date.now(); return; }
      const now = Date.now();
      const duration = Math.min(3600, Math.floor((now - Math.max(activeSince, getUsageAnalyticsEnabledAt())) / 1000));
      if (duration < 10) return;
      activeSince = now;
      void recordProgressEvent({ clientEventId: `session:${now}`, eventType: "app_session", skillSlug: "app", metadata: { duration_seconds: duration } }).catch(() => undefined);
    };
    // Record while foregrounded too: mobile OSes may suspend a network request on background.
    const interval = setInterval(recordElapsed, 60_000);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") { activeSince = Date.now(); void getUsageAnalyticsConsent(); return; }
      recordElapsed();
      activeSince = 0;
    });
    return () => { clearInterval(interval); subscription.remove(); };
  }, []);
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "default",
      }}
    >
      <Stack.Screen name="index" />

      <Stack.Screen name="onboarding" />

      <Stack.Screen name="account" />

      <Stack.Screen name="popular-skills" />

      <Stack.Screen name="account-progress" />

      <Stack.Screen name="goals" />

      <Stack.Screen name="focus" />

      <Stack.Screen name="legal" />

      <Stack.Screen name="help" />

      <Stack.Screen name="settings" />

      <Stack.Screen name="feedback" />

      <Stack.Screen name="rewards" />

      <Stack.Screen name="schedule" />

      <Stack.Screen name="accountability" />

      <Stack.Screen name="commitment" />

      <Stack.Screen name="plan" />

      <Stack.Screen name="daily" />

      <Stack.Screen name="learning" />

      <Stack.Screen name="quiz" />

      <Stack.Screen name="action" />

      <Stack.Screen name="project" />

      <Stack.Screen name="proof" />

      <Stack.Screen name="skilltree" />

      <Stack.Screen name="progress-screen" />
    </Stack>
  );
}
