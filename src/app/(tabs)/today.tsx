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
  const todayRecord = todayMission ? records[todayMission.id] : undefined;
  const todayComplete = todayRecord?.status === "completed";
  const missionStage = todayComplete
    ? 3
    : todayRecord?.status === "proof_required" || todayRecord?.status === "proof_submitted"
      ? 2
      : todayRecord?.status === "in_progress"
        ? 1
        : 0;
  const hasStarted = missionStage > 0;
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

      <View style={[styles.momentum, { backgroundColor: theme.surfaceStrong, borderColor: theme.border }]}>
        <View style={styles.momentumCopy}>
          <Text style={[styles.momentumLabel, { color: theme.accent }]}>{todayComplete ? "TODAY’S WIN" : hasStarted ? "KEEP YOUR MOMENTUM" : "READY WHEN YOU ARE"}</Text>
          <Text style={[styles.momentumTitle, { color: theme.text }]}>{todayComplete ? "Locked in." : hasStarted ? "Pick up where you left off." : "Make one real thing better."}</Text>
        </View>
        <View style={styles.momentumScore}><Text style={[styles.momentumNumber, { color: theme.accent }]}>{todayComplete ? "✓" : `${missionStage}/3`}</Text></View>
      </View>

      <RiseCard style={styles.missionCard}>
        <View style={styles.missionHeader}>
          <RiseEyebrow>DAY {todayMission?.day || 1} OF {plan.length || 7}</RiseEyebrow>
          <View style={[styles.readyPill, { backgroundColor: theme.surfaceStrong }]}><Text style={[styles.readyText, { color: theme.accent }]}>{todayComplete ? "COMPLETE" : hasStarted ? "IN PROGRESS" : "READY"}</Text></View>
        </View>

        <Text style={[styles.missionTitle, { color: theme.text }]}>
          {todayMission?.title || "Build your first focused win"}
        </Text>
        <Text style={[styles.missionSummary, { color: theme.muted }]}>{missionSummary}</Text>

        <View style={styles.statsRow}>
          <MissionStat label="TIME" value={`${todayMission?.duration || 30} min`} />
          <MissionStat label="REWARD" value={`+${todayMission?.reward || 40} XP`} />
          <MissionStat label="FOCUS" value={todayMission?.focusSkill || profile?.weeklySkill || "Foundations"} wide />
        </View>

        <View style={styles.trail} accessibilityLabel={`${missionStage} of 3 mission stages complete`}>
          {["Choose", "Do", "Prove"].map((label, index) => {
            const reached = missionStage > index || todayComplete;
            const active = !todayComplete && missionStage === index;
            return <View key={label} style={styles.trailStep}><View style={[styles.trailDot, { borderColor: reached || active ? theme.accent : theme.border, backgroundColor: reached ? theme.accent : active ? theme.surfaceStrong : theme.surface }]}><Text style={[styles.trailDotText, { color: reached ? theme.accentInk : active ? theme.accent : theme.muted }]}>{reached ? "✓" : index + 1}</Text></View><Text style={[styles.trailLabel, { color: active || reached ? theme.text : theme.muted }]}>{label}</Text>{index < 2 ? <View style={[styles.trailLine, { backgroundColor: missionStage > index ? theme.accent : theme.border }]} /> : null}</View>;
          })}
        </View>

        <View style={styles.primaryAction}>
          <RiseButton
            disabled={todayComplete}
            label={todayComplete ? "Complete — come back tomorrow" : hasStarted ? "Continue my mission" : "Start today’s mission"}
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

function MissionStat({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  const { theme } = useRiseAppearance();
  return <View style={[styles.stat, wide && styles.statWide, { backgroundColor: theme.surfaceStrong }]}><Text style={[styles.statLabel, { color: theme.muted }]}>{label}</Text><Text numberOfLines={1} style={[styles.statValue, { color: theme.text }]}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { paddingHorizontal: 22, paddingTop: 58, paddingBottom: 112 },
  greeting: { fontSize: 34, lineHeight: 40, fontWeight: "800", letterSpacing: -0.8 },
  intro: { fontSize: 15, lineHeight: 22, marginTop: 8, marginBottom: 18 },
  momentum: { minHeight: 86, borderRadius: 20, borderWidth: 1, paddingHorizontal: 18, paddingVertical: 16, flexDirection: "row", alignItems: "center", marginBottom: 14 },
  momentumCopy: { flex: 1, paddingRight: 12 },
  momentumLabel: { fontSize: 9, fontWeight: "900", letterSpacing: 1.2 },
  momentumTitle: { fontSize: 17, lineHeight: 22, fontWeight: "900", marginTop: 5 },
  momentumScore: { width: 52, height: 52, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  momentumNumber: { fontSize: 22, fontWeight: "900" },
  missionCard: { padding: 22 },
  missionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 19 },
  readyPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  readyText: { fontSize: 8, fontWeight: "900", letterSpacing: 1 },
  missionTitle: { fontSize: 30, lineHeight: 36, fontWeight: "800", letterSpacing: -0.6 },
  missionSummary: { fontSize: 15, lineHeight: 23, marginTop: 12 },
  statsRow: { flexDirection: "row", gap: 8, marginTop: 22 },
  stat: { minWidth: 68, borderRadius: 13, paddingHorizontal: 10, paddingVertical: 10 },
  statWide: { flex: 1 },
  statLabel: { fontSize: 7, fontWeight: "900", letterSpacing: .9 },
  statValue: { fontSize: 11, fontWeight: "900", marginTop: 4 },
  trail: { flexDirection: "row", alignItems: "flex-start", marginTop: 22 },
  trailStep: { flex: 1, alignItems: "center", position: "relative" },
  trailDot: { width: 32, height: 32, borderRadius: 11, borderWidth: 1, alignItems: "center", justifyContent: "center", zIndex: 2 },
  trailDotText: { fontSize: 11, fontWeight: "900" },
  trailLabel: { fontSize: 9, fontWeight: "800", marginTop: 7 },
  trailLine: { position: "absolute", height: 2, width: "66%", top: 15, left: "67%", zIndex: 1 },
  primaryAction: { marginTop: 22 },
  secondaryRow: { marginTop: 20 },
  secondaryLink: { minHeight: 54, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4 },
  secondaryText: { fontSize: 14, fontWeight: "700" },
  secondaryArrow: { fontSize: 18, fontWeight: "800" },
  divider: { height: 1 },
  progressNote: { fontSize: 11, textAlign: "center", marginTop: 20 },
  pressed: { opacity: 0.68 },
});
