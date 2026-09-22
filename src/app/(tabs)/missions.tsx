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

export default function MissionsTabScreen() {
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

  const openMission = (mission: PersonalizedMission) => {
    router.push({ pathname: "/action", params: { mission: JSON.stringify(mission) } } as any);
  };

  if (!profile) {
    return <View style={styles.loading}><ActivityIndicator color="#7AF5B8" /></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.logo}>RISE</Text>
      <Text style={styles.heading}>Your 1% missions</Text>
      <Text style={styles.subtitle}>
        A connected plan for “{profile.customGoal}.” Choose any mission to see
        the steps, learning link, local options, and required proof.
      </Text>
      <Pressable accessibilityRole="button" onPress={() => router.push("/(tabs)/progress" as never)} style={({ pressed }) => [styles.progressLink, pressed && styles.progressLinkPressed]}><View><Text style={styles.progressLabel}>YOUR CYCLE</Text><Text style={styles.progressValue}>{completedCount} of {missions.length} days complete</Text></View><Text style={styles.progressAction}>View my progress ↗</Text></Pressable>

      <View style={styles.pathNote}>
        <Text style={styles.pathNoteTitle}>HOW THE PATH WORKS</Text>
        <Text style={styles.pathNoteText}>Learn → practice → apply → prove → improve</Text>
      </View>

      {missions.map((mission) => (
        <Pressable key={mission.id} style={styles.card} onPress={() => openMission(mission)}>
          <View style={styles.topRow}>
            <Text style={styles.day}>DAY {mission.day} {records[mission.id]?.status === "completed" ? "• COMPLETE" : ""}</Text>
            <Text style={styles.reward}>+{mission.reward} XP</Text>
          </View>
          <Text style={styles.cardTitle}>{mission.title}</Text>
          <Text style={styles.cardDescription}>{mission.description}</Text>
          <View style={styles.row}>
            <Text style={styles.meta}>{mission.duration} min • {mission.difficulty} • +{mission.coinReward} 🪙</Text>
            <Text style={styles.open}>Open mission →</Text>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: "#010807", alignItems: "center", justifyContent: "center" },
  container: { flex: 1, backgroundColor: "#010807" },
  content: { padding: 24, paddingTop: 60, paddingBottom: 120 },
  logo: { fontSize: 18, fontWeight: "900", letterSpacing: 5, color: "#7AF5B8", marginBottom: 20 },
  heading: { fontSize: 34, fontWeight: "900", color: "#F5FFF9", marginBottom: 8 },
  subtitle: { color: "#C8EED9", fontSize: 15, lineHeight: 22, marginBottom: 18 },
  progressLink: { minHeight: 70, borderRadius: 16, borderWidth: 1, borderColor: "#3B7555", backgroundColor: "#0D2F22", paddingHorizontal: 16, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 18 },
  progressLinkPressed: { opacity: .82 },
  progressLabel: { color: "#8FB6A2", fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  progressValue: { color: "#F5FFF9", fontSize: 15, fontWeight: "900", marginTop: 4 },
  progressAction: { color: "#7AF5B8", fontSize: 11, fontWeight: "900" },
  pathNote: { borderRadius: 16, backgroundColor: "rgba(122,245,184,0.08)", borderWidth: 1, borderColor: "rgba(122,245,184,0.2)", padding: 14, marginBottom: 22 },
  pathNoteTitle: { color: "#7AF5B8", fontSize: 9, fontWeight: "900", letterSpacing: 1.2 },
  pathNoteText: { color: "#E8F8EF", fontSize: 13, fontWeight: "800", marginTop: 6 },
  card: { backgroundColor: "#071B16", borderRadius: 20, padding: 18, borderWidth: 1, borderColor: "#1E3A31", marginBottom: 13 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  day: { color: "#7AF5B8", fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  cardTitle: { color: "#F5FFF9", fontSize: 20, fontWeight: "900", marginTop: 8, marginBottom: 7 },
  cardDescription: { color: "#C8EED9", fontSize: 13, lineHeight: 19, marginBottom: 14 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  meta: { color: "#8FB6A2", fontSize: 11, fontWeight: "700" },
  reward: { color: "#7AF5B8", fontSize: 12, fontWeight: "900" },
  open: { color: "#7AF5B8", fontSize: 12, fontWeight: "800" },
});
