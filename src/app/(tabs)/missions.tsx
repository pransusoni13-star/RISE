import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import {
  createSevenDayPlan,
  loadProfile,
  PersonalizedMission,
  RiseProfile,
} from "../../services/personalization";
import { missionRepository, MissionRecord } from "../../services/missionRepository";
import { daysUntilMission, getAvailableMissionDay, getUnlockedDay } from "../../services/dayUnlock";
import { useRiseAppearance } from "../../services/appearance";

export default function MissionsTabScreen() {
  const { theme } = useRiseAppearance();
  const [profile, setProfile] = useState<RiseProfile | null>(null);
  const [records, setRecords] = useState<Record<string, MissionRecord>>({});

  useFocusEffect(useCallback(() => {
    let active = true;
    void Promise.all([loadProfile(), missionRepository.list()]).then(([savedProfile, savedRecords]) => {
      if (!active) return;
      setProfile(savedProfile);
      setRecords(Object.fromEntries(savedRecords.map((record) => [record.missionId, record])));
    });
    return () => { active = false; };
  }, []));

  const missions = useMemo(
    () => (profile ? createSevenDayPlan(profile) : []),
    [profile]
  );
  const completedCount = missions.filter((mission) => records[mission.id]?.status === "completed").length;
  const calendarDay = getUnlockedDay(profile?.skillStartDate, missions.length || 1);
  const completedDays = missions.filter((mission) => records[mission.id]?.status === "completed").map((mission) => mission.day);
  const unlockedDay = getAvailableMissionDay(profile?.skillStartDate, missions.length || 1, completedDays);

  const openMission = (mission: PersonalizedMission) => {
    router.push({ pathname: "/action", params: { mission: JSON.stringify(mission) } } as any);
  };

  if (!profile) {
    return <View style={[styles.loading, { backgroundColor: theme.background }]}><ActivityIndicator color={theme.accent} /></View>;
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={[styles.heading, { color: theme.text }]}>Missions 🎯</Text>
      <Text style={[styles.subtitle, { color: theme.muted }]}>One a day. Do it. Prove it. Grow.</Text>
      <Pressable accessibilityRole="button" onPress={() => router.push("/(tabs)/progress" as never)} style={({ pressed }) => [styles.progressLink, { backgroundColor: theme.surfaceStrong, borderColor: theme.border }, pressed && styles.progressLinkPressed]}><View><Text style={[styles.progressLabel, { color: theme.muted }]}>YOUR 7-DAY RUN</Text><Text style={[styles.progressValue, { color: theme.text }]}>{completedCount}/{missions.length} complete</Text></View><Text style={[styles.progressAction, { color: theme.accent }]}>See progress ›</Text></Pressable>

      {missions.map((mission) => {
        const locked = mission.day > unlockedDay;
        const wait = daysUntilMission(mission.day, calendarDay);
        const waitingForEarlierMission = mission.day > unlockedDay && mission.day <= calendarDay;
        return (
        <Pressable key={mission.id} disabled={locked} accessibilityState={{ disabled: locked }} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }, locked && styles.cardLocked]} onPress={() => openMission(mission)}>
          <View style={styles.topRow}>
            <Text style={styles.day}>DAY {mission.day} {records[mission.id]?.status === "completed" ? "• COMPLETE" : locked ? "• LOCKED" : "• READY"}</Text>
            <Text style={styles.reward}>+{mission.reward} XP</Text>
          </View>
          <Text style={[styles.track, mission.track === "life" && styles.lifeTrack]}>{mission.track.toUpperCase()} • {mission.focusSkill}</Text>
          <Text style={[styles.cardTitle, { color: theme.text }]}>{mission.title}</Text>
          <Text style={[styles.cardDescription, { color: theme.muted }]} numberOfLines={2}>{mission.description}</Text>
          <View style={styles.row}>
            <Text style={styles.meta}>⏱ {mission.duration}m  ·  +{mission.coinReward} 🪙</Text>
            <Text style={styles.open}>{locked ? waitingForEarlierMission ? `Finish Day ${mission.day - 1} 🔒` : (wait === 1 ? "Tomorrow 🔒" : `${wait} days 🔒`) : "Let’s go →"}</Text>
          </View>
        </Pressable>
      )})}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: "#010807", alignItems: "center", justifyContent: "center" },
  container: { flex: 1, backgroundColor: "#010807" },
  content: { padding: 24, paddingTop: 60, paddingBottom: 120 },
  logo: { fontSize: 18, fontWeight: "900", letterSpacing: 5, color: "#7AF5B8", marginBottom: 20 },
  heading: { fontSize: 34, fontWeight: "900", color: "#F5FFF9", marginBottom: 8 },
  subtitle: { color: "#9FC3AF", fontSize: 15, lineHeight: 22, marginBottom: 18 },
  progressLink: { minHeight: 70, borderRadius: 16, borderWidth: 1, borderColor: "#3B7555", backgroundColor: "#0D2F22", paddingHorizontal: 16, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 18 },
  progressLinkPressed: { opacity: .82 },
  progressLabel: { color: "#8FB6A2", fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  progressValue: { color: "#F5FFF9", fontSize: 15, fontWeight: "900", marginTop: 4 },
  progressAction: { color: "#7AF5B8", fontSize: 11, fontWeight: "900" },
  card: { backgroundColor: "#071B16", borderRadius: 22, padding: 17, borderWidth: 1, borderColor: "#1E3A31", marginBottom: 12 },
  cardLocked: { opacity: 0.48, borderStyle: "dashed" },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  day: { color: "#7AF5B8", fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  track: { alignSelf: "flex-start", color: "#D8FFE9", backgroundColor: "#164A37", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, fontSize: 10, fontWeight: "900", marginTop: 10 },
  lifeTrack: { backgroundColor: "#233D69", color: "#E6EEFF" },
  cardTitle: { color: "#F5FFF9", fontSize: 20, fontWeight: "900", marginTop: 8, marginBottom: 5 },
  cardDescription: { color: "#A7CBB7", fontSize: 12, lineHeight: 18, marginBottom: 13 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  meta: { color: "#8FB6A2", fontSize: 11, fontWeight: "700" },
  reward: { color: "#7AF5B8", fontSize: 12, fontWeight: "900" },
  open: { color: "#7AF5B8", fontSize: 12, fontWeight: "800" },
});
