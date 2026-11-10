import "@/global.css";
import { router, Stack, type ErrorBoundaryProps, usePathname } from "expo-router";
import { useEffect, useState } from "react";
import { AppState, Pressable, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { flushCloudSyncQueue, getUsageAnalyticsConsent, getUsageAnalyticsEnabledAt, isUsageAnalyticsEnabled, recordProgressEvent } from "../services/auth";
import { initializeReminderNavigation } from "../services/reminders";
import { RiseAppearanceProvider, useRiseAppearance } from "../services/appearance";
import { hasSavedProfile } from "../services/personalization";
import { AppPageHeader } from "../components/appPageHeader";

const ANALYTICS_FLUSH_INTERVAL_MS = 5 * 60 * 1000;

function ScreenErrorBoundary({ retry }: ErrorBoundaryProps) {
  const { theme } = useRiseAppearance();
  return <View style={[styles.errorScreen, { backgroundColor: theme.background }]}>
    <Text style={[styles.errorEyebrow, { color: theme.accent }]}>YOUR PROGRESS IS SAFE</Text>
    <Text style={[styles.errorTitle, { color: theme.text }]}>This screen needs another try.</Text>
    <Text style={[styles.errorBody, { color: theme.muted }]}>RISE hit a temporary display problem. Retry the screen without losing your saved plan or mission progress.</Text>
    <Pressable accessibilityRole="button" onPress={() => void retry()} style={[styles.errorButton, { backgroundColor: theme.accent }]}>
      <Text style={[styles.errorButtonText, { color: theme.background }]}>Try again</Text>
    </Pressable>
    <Pressable accessibilityRole="button" onPress={() => router.replace("/(tabs)/today" as never)}>
      <Text style={[styles.errorLink, { color: theme.accent }]}>Return to Today</Text>
    </Pressable>
  </View>;
}

export default function RootLayout() {
  return <RiseAppearanceProvider><ThemedRootLayout /></RiseAppearanceProvider>;
}

function ThemedRootLayout() {
  const { theme } = useRiseAppearance();
  const pathname = usePathname();
  const [showMemberHeader, setShowMemberHeader] = useState(false);
  useEffect(() => {
    let active = true;
    void hasSavedProfile().then((hasPlan) => { if (active) setShowMemberHeader(hasPlan); }).catch(() => { if (active) setShowMemberHeader(false); });
    return () => { active = false; };
  }, [pathname]);
  useEffect(() => {
    let dispose: (() => void) | undefined;
    let mounted = true;
    void initializeReminderNavigation(() => router.push("/(tabs)/today" as never)).then((cleanup) => {
      if (mounted) dispose = cleanup;
      else cleanup();
    }).catch(() => undefined);
    return () => { mounted = false; dispose?.(); };
  }, []);
  useEffect(() => {
    void flushCloudSyncQueue();
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
    // Aggregate foreground time locally and sync every five minutes instead of
    // writing one analytics row per minute. Backgrounding still flushes the
    // partial session, so measured time remains accurate with far less load.
    const interval = setInterval(recordElapsed, ANALYTICS_FLUSH_INTERVAL_MS);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") { activeSince = Date.now(); void getUsageAnalyticsConsent(); void flushCloudSyncQueue(); return; }
      recordElapsed();
      activeSince = 0;
    });
    return () => { clearInterval(interval); subscription.remove(); };
  }, []);
  return (<View style={{ flex: 1, backgroundColor: theme.background }}>
    <StatusBar style={theme.mode === "dark" ? "light" : "dark"} />
    {showMemberHeader ? <AppPageHeader /> : null}
    <Stack
      unstable_screenErrorBoundary={ScreenErrorBoundary}
      screenOptions={{
        headerShown: false,
        animation: "default",
        contentStyle: { backgroundColor: theme.background },
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

      <Stack.Screen name="privacy" />

      <Stack.Screen name="privacy-choices" />

      <Stack.Screen name="terms" />

      <Stack.Screen name="help" />

      <Stack.Screen name="tour" />

      <Stack.Screen name="support" />

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
  </View>);
}

const styles = StyleSheet.create({
  errorScreen: { flex: 1, justifyContent: "center", paddingHorizontal: 28 },
  errorEyebrow: { fontSize: 12, fontWeight: "800", letterSpacing: 1.4, marginBottom: 12 },
  errorTitle: { fontSize: 30, fontWeight: "900", lineHeight: 34, marginBottom: 12 },
  errorBody: { fontSize: 16, lineHeight: 24, marginBottom: 24 },
  errorButton: { minHeight: 54, borderRadius: 16, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
  errorButtonText: { fontSize: 16, fontWeight: "900" },
  errorLink: { alignSelf: "center", fontSize: 15, fontWeight: "800", marginTop: 20, padding: 8 },
});
