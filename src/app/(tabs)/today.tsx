import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppPageHeader } from "../../components/appPageHeader";
import { RiseButton, RiseCard, RiseEyebrow } from "../../components/rise-ui";
import { getCurrentUser, RiseUser } from "../../services/auth";
import { getAvailableMissionDay } from "../../services/dayUnlock";
import { missionRepository, MissionRecord } from "../../services/missionRepository";
import { createSevenDayPlan, loadProfile, RiseProfile } from "../../services/personalization";
import { useRiseAppearance } from "../../services/appearance";

export default function TodayTabScreen() {
  const { theme } = useRiseAppearance();
  const [profile, setProfile] = useState<RiseProfile | null>(null);
  const [user, setUser] = useState<RiseUser | null>(null);
  const [records, setRecords] = useState<Record<string, MissionRecord>>({});

  useFocusEffect(useCallback(() => {
    let active = true;
    void Promise.all([
      loadProfile(),
      getCurrentUser().catch(() => null),
      missionRepository.list(),
    ]).then(([storedProfile, storedUser, storedRecords]) => {
      if (!active) return;
      setProfile(storedProfile);
      setUser(storedUser);
      setRecords(Object.fromEntries(storedRecords.map((record) => [record.missionId, record])));
    });
    return () => { active = false; };
  }, []));

  const plan = useMemo(() => profile ? createSevenDayPlan(profile) : [], [profile]);
  const completedDays = useMemo(
    () => plan.filter((mission) => records[mission.id]?.status === "completed").map((mission) => mission.day),
    [plan, records],
  );
  const availableDay = getAvailableMissionDay(profile?.skillStartDate, plan.length || 1, completedDays);
  const todayMission = plan[availableDay - 1] || plan[0];
  const todayComplete = Boolean(todayMission && records[todayMission.id]?.status === "completed");
  const firstName = user?.display_name.trim().split(/\s+/)[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : hour < 21 ? "Good evening" : "Good night";
  const missionSummary = (todayMission?.description || "Your next focused step is ready.").split(/(?<=[.!?])\s+/)[0];

  return (
    <ScrollView
      style={[styles.page, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <AppPageHeader />

      <Text style={[styles.greeting, { color: theme.text }]}>
        {greeting}{firstName ? `, ${firstName}` : ""}.
      </Text>
      <Text style={[styles.intro, { color: theme.muted }]}>One focused step. That is all you need today.</Text>

      <RiseCard style={styles.missionCard}>
        <View style={styles.missionHeader}>
          <RiseEyebrow>DAY {todayMission?.day || 1} OF {plan.length || 7}</RiseEyebrow>
          <Text style={[styles.duration, { color: theme.muted }]}>{todayMission?.duration || 30} MIN</Text>
        </View>

        <Text style={[styles.missionTitle, { color: theme.text }]}>
          {todayMission?.title || "Build your first focused win"}
        </Text>
        <Text style={[styles.missionSummary, { color: theme.muted }]}>{missionSummary}</Text>

        <View style={[styles.focusLine, { borderColor: theme.border }]}>
          <Text style={[styles.focusLabel, { color: theme.muted }]}>TODAY&apos;S FOCUS</Text>
          <Text style={[styles.focusValue, { color: theme.text }]}>{todayMission?.focusSkill || profile?.weeklySkill || "Foundations"}</Text>
        </View>

        <View style={styles.primaryAction}>
          <RiseButton
            disabled={todayComplete}
            label={todayComplete ? "Complete — come back tomorrow" : "Start today’s mission"}
            onPress={() => router.push({ pathname: "/action", params: todayMission ? { mission: JSON.stringify(todayMission) } : {} } as any)}
          />
        </View>
      </RiseCard>

      <View style={styles.secondaryRow}>
        <Pressable accessibilityRole="button" onPress={() => router.push("/(tabs)/learn" as never)} style={({ pressed }) => [styles.secondaryLink, pressed && styles.pressed]}>
          <Text style={[styles.secondaryText, { color: theme.text }]}>Learn today&apos;s skill</Text>
          <Text style={[styles.secondaryArrow, { color: theme.accent }]}>→</Text>
        </Pressable>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <Pressable accessibilityRole="button" onPress={() => router.push("/goals" as never)} style={({ pressed }) => [styles.secondaryLink, pressed && styles.pressed]}>
          <Text style={[styles.secondaryText, { color: theme.text }]}>Change my plan</Text>
          <Text style={[styles.secondaryArrow, { color: theme.accent }]}>→</Text>
        </Pressable>
      </View>

      <Text style={[styles.progressNote, { color: theme.muted }]}>
        {completedDays.length} of {plan.length || 7} missions complete
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { paddingHorizontal: 22, paddingTop: 58, paddingBottom: 112 },
  greeting: { fontSize: 34, lineHeight: 40, fontWeight: "800", letterSpacing: -0.8 },
  intro: { fontSize: 15, lineHeight: 22, marginTop: 8, marginBottom: 28 },
  missionCard: { padding: 22 },
  missionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 22 },
  duration: { fontSize: 10, fontWeight: "800", letterSpacing: 1.1 },
  missionTitle: { fontSize: 30, lineHeight: 36, fontWeight: "800", letterSpacing: -0.6 },
  missionSummary: { fontSize: 15, lineHeight: 23, marginTop: 12 },
  focusLine: { borderTopWidth: 1, marginTop: 24, paddingTop: 16 },
  focusLabel: { fontSize: 9, fontWeight: "900", letterSpacing: 1.3 },
  focusValue: { fontSize: 14, fontWeight: "800", marginTop: 6 },
  primaryAction: { marginTop: 22 },
  secondaryRow: { marginTop: 20 },
  secondaryLink: { minHeight: 54, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4 },
  secondaryText: { fontSize: 14, fontWeight: "700" },
  secondaryArrow: { fontSize: 18, fontWeight: "800" },
  divider: { height: 1 },
  progressNote: { fontSize: 11, textAlign: "center", marginTop: 20 },
  pressed: { opacity: 0.68 },
});
