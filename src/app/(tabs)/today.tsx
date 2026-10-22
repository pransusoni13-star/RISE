import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

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
      <Text style={[styles.intro, { color: theme.muted }]}>{todayComplete ? "Today’s work is saved. Your next mission opens tomorrow." : "This is the one step that matters today."}</Text>

      <RiseCard style={styles.missionCard}>
        <View style={styles.missionHeader}>
          <RiseEyebrow>TODAY’S ONE MISSION · DAY {todayMission?.day || 1}</RiseEyebrow>
          <View style={[styles.readyPill, { backgroundColor: theme.surfaceStrong }]}><Text style={[styles.readyText, { color: theme.accent }]}>{todayComplete ? "COMPLETE" : hasStarted ? "IN PROGRESS" : "READY"}</Text></View>
        </View>

        <Text style={[styles.missionTitle, { color: theme.text }]}>
          {todayMission?.title || "Build your first focused win"}
        </Text>
        <Text style={[styles.missionSummary, { color: theme.muted }]}>{missionSummary}</Text>

        <View style={[styles.valueStrip, { backgroundColor: theme.surfaceStrong }]}>
          <Text style={[styles.valueLabel, { color: theme.accent }]}>WHY THIS MATTERS</Text>
          <Text style={[styles.valueText, { color: theme.text }]}>{todayMission?.onePercent || `You will strengthen ${todayMission?.focusSkill || profile?.weeklySkill || "your focus"} with work you can show.`}</Text>
        </View>

        <View style={styles.statsRow}>
          <MissionStat label="TIME" value={`${todayMission?.duration || 30} min`} />
          <MissionStat label="REWARD" value={`+${todayMission?.reward || 40} XP`} />
          <MissionStat label="FOCUS" value={todayMission?.focusSkill || profile?.weeklySkill || "Foundations"} />
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
        <Text style={[styles.progressNote, { color: theme.muted }]}>{todayComplete ? `${completedDays.length} of ${plan.length || 7} missions complete` : "RISE saves each step as you go."}</Text>
      </RiseCard>
    </ScrollView>
  );
}

function MissionStat({ label, value }: { label: string; value: string }) {
  const { theme } = useRiseAppearance();
  return <View style={[styles.stat, { backgroundColor: theme.surfaceStrong }]}><Text style={[styles.statLabel, { color: theme.muted }]}>{label}</Text><Text numberOfLines={1} style={[styles.statValue, { color: theme.text }]}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { paddingHorizontal: 22, paddingTop: 58, paddingBottom: 112 },
  greeting: { fontSize: 34, lineHeight: 40, fontWeight: "800", letterSpacing: -0.8 },
  intro: { fontSize: 15, lineHeight: 22, marginTop: 8, marginBottom: 18 },
  missionCard: { padding: 22 },
  missionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 19 },
  readyPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  readyText: { fontSize: 8, fontWeight: "900", letterSpacing: 1 },
  missionTitle: { fontSize: 30, lineHeight: 36, fontWeight: "800", letterSpacing: -0.6 },
  missionSummary: { fontSize: 15, lineHeight: 23, marginTop: 12 },
  valueStrip: { borderRadius: 15, padding: 14, marginTop: 20 },
  valueLabel: { fontSize: 8, fontWeight: "900", letterSpacing: 1.1 },
  valueText: { fontSize: 12, lineHeight: 18, fontWeight: "700", marginTop: 5 },
  statsRow: { flexDirection: "row", gap: 8, marginTop: 22 },
  stat: { flex: 1, minWidth: 68, borderRadius: 13, paddingHorizontal: 10, paddingVertical: 10 },
  statLabel: { fontSize: 7, fontWeight: "900", letterSpacing: .9 },
  statValue: { fontSize: 11, fontWeight: "900", marginTop: 4 },
  trail: { flexDirection: "row", alignItems: "flex-start", marginTop: 22 },
  trailStep: { flex: 1, alignItems: "center", position: "relative" },
  trailDot: { width: 32, height: 32, borderRadius: 11, borderWidth: 1, alignItems: "center", justifyContent: "center", zIndex: 2 },
  trailDotText: { fontSize: 11, fontWeight: "900" },
  trailLabel: { fontSize: 9, fontWeight: "800", marginTop: 7 },
  trailLine: { position: "absolute", height: 2, width: "66%", top: 15, left: "67%", zIndex: 1 },
  primaryAction: { marginTop: 22 },
  progressNote: { fontSize: 10, textAlign: "center", marginTop: 13 },
});
