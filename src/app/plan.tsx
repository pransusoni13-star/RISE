import React, { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import {
  createSevenDayPlan,
  loadProfile,
  PersonalizedMission,
  RiseProfile,
} from "../services/personalization";
import { missionRepository } from "../services/missionRepository";

const valueOf = (value: string | string[] | undefined, fallback = "") =>
  Array.isArray(value) ? value[0] || fallback : value || fallback;

export default function PlanScreen() {
  const params = useLocalSearchParams();
  const [savedProfile, setSavedProfile] = useState<RiseProfile | null>(null);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const hasPlanParams = Boolean(params.goals || params.customGoal || params.weeklySkill);

  const paramProfile = useMemo<RiseProfile>(() => {
    let goals = ["personal"];
    try {
      const parsed = JSON.parse(valueOf(params.goals, "[]"));
      if (Array.isArray(parsed) && parsed.length) goals = parsed.slice(0, 2).map(String);
    } catch {}
    let focusSkills: string[] = [];
    try {
      const parsed = JSON.parse(valueOf(params.focusSkills, "[]"));
      if (Array.isArray(parsed)) focusSkills = parsed.slice(0, 3).map(String);
    } catch {}

    return {
      selectedGoals: goals,
      customGoal: valueOf(params.customGoal, "Build a useful skill"),
      weeklySkill: valueOf(params.weeklySkill, "Foundations"),
      focusSkills,
      skillStartDate: valueOf(params.skillStartDate, new Date().toISOString()),
      currentSituation: valueOf(params.currentSituation) || undefined,
      experience: valueOf(params.experience) || undefined,
      availableTime: valueOf(params.availableTime, valueOf(params.time, "30 minutes")),
      accountability: valueOf(params.accountability) || undefined,
      commitment: valueOf(params.commitment, "Every 7 days"),
      spiritualTradition: valueOf(params.spiritualTradition) || undefined,
      trustedSources: valueOf(params.trustedSources) || undefined,
    };
  }, [params]);

  useFocusEffect(React.useCallback(() => {
    let active = true;
    void Promise.all([loadProfile(), missionRepository.list()]).then(([storedProfile, records]) => {
      if (!active) return;
      setSavedProfile(storedProfile);
      setCompletedIds(records.filter((record) => record.status === "completed").map((record) => record.missionId));
    });
    return () => { active = false; };
  }, []));

  const profile = hasPlanParams ? paramProfile : savedProfile;
  const missions = useMemo(() => profile ? createSevenDayPlan(profile) : [], [profile]);
  const completedCount = missions.filter((mission) => completedIds.includes(mission.id)).length;
  const nextMission = missions.find((mission) => !completedIds.includes(mission.id));

  const openMission = (mission: PersonalizedMission) => {
    router.push({
      pathname: "/action",
      params: { mission: JSON.stringify(mission) },
    } as any);
  };

  if (!profile) return <View style={styles.loading}><ActivityIndicator color="#7AF5B8" /></View>;

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>YOUR PERSONAL 1% SYSTEM</Text>
        <Text style={styles.title}>
          One connected cycle.{"\n"}<Text style={styles.green}>Two balanced directions.</Text>
        </Text>
        <Text style={styles.subtitle}>
          Built for “{profile.customGoal}” by strengthening {profile.weeklySkill} at {profile.availableTime} per day.
          Each mission teaches, applies, and proves the next step.
        </Text>

        <View style={styles.summary}>
          <View>
            <Text style={styles.summaryLabel}>SKILL</Text>
            <Text style={styles.summaryValue}>{profile.weeklySkill}</Text>
          </View>
          <View>
            <Text style={styles.summaryLabel}>CYCLE</Text>
            <Text style={styles.summaryValue}>{profile.commitment}</Text>
          </View>
          <View>
            <Text style={styles.summaryLabel}>DAILY</Text>
            <Text style={styles.summaryValue}>{profile.availableTime}</Text>
          </View>
        </View>

        <View style={styles.sectionRow}>
          <View><Text style={styles.section}>YOUR {missions.length}-DAY PATH</Text><Text style={styles.progressCopy}>{completedCount} of {missions.length} missions complete</Text></View>
          <Pressable accessibilityRole="button" onPress={() => router.push("/(tabs)/progress" as never)} style={({ pressed }) => [styles.progressButton, pressed && styles.pressed]}><Text style={styles.progressButtonText}>View my progress ↗</Text></Pressable>
        </View>
        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${missions.length ? completedCount / missions.length * 100 : 0}%` }]} /></View>
        {missions.map((mission) => (
          <Pressable key={mission.id} accessibilityRole="button" style={({ pressed }) => [styles.card, completedIds.includes(mission.id) && styles.cardComplete, pressed && styles.pressed]} onPress={() => openMission(mission)}>
            <View style={styles.dayCircle}><Text style={styles.dayText}>{completedIds.includes(mission.id) ? "✓" : mission.day}</Text></View>
            <View style={styles.cardBody}>
              <Text style={styles.cardMeta}>DAY {mission.day} • {mission.duration} MIN • {completedIds.includes(mission.id) ? "COMPLETE" : mission.difficulty}</Text>
              <Text style={styles.cardTitle}>{mission.title}</Text>
              <Text style={styles.cardDescription} numberOfLines={2}>{mission.description}</Text>
              <Text style={styles.connection}>{mission.day === 1 ? "Starts your baseline" : `Builds on Day ${mission.day - 1}`}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </Pressable>
        ))}

        <View style={styles.proofCard}>
          <Text style={styles.proofTitle}>Progress requires proof</Text>
          <Text style={styles.proofText}>
            Every mission ends with reviewed proof and a 2–3 sentence reflection.
            The cycle quiz must be passed before new skills unlock.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable accessibilityRole="button" style={({ pressed }) => [styles.button, pressed && styles.pressed]} onPress={() => nextMission ? openMission(nextMission) : router.push("/(tabs)/progress" as never)}>
          <Text style={styles.buttonText}>{nextMission ? `Continue Day ${nextMission.day} →` : "View my progress →"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: "#010807", alignItems: "center", justifyContent: "center" },
  pressed: { opacity: .82, transform: [{ scale: .995 }] },
  page: { flex: 1, backgroundColor: "#010807" },
  content: { padding: 22, paddingTop: 58, paddingBottom: 120 },
  eyebrow: { color: "#7AF5B8", fontSize: 11, fontWeight: "900", letterSpacing: 1.7, marginBottom: 14 },
  title: { color: "#F5FFF9", fontSize: 38, lineHeight: 44, fontWeight: "900" },
  green: { color: "#7AF5B8" },
  subtitle: { color: "#BBD8C8", fontSize: 15, lineHeight: 23, marginTop: 14, marginBottom: 22 },
  summary: { flexDirection: "row", justifyContent: "space-between", gap: 8, backgroundColor: "#071B16", borderWidth: 1, borderColor: "#1E3A31", borderRadius: 18, padding: 15, marginBottom: 28 },
  summaryLabel: { color: "#6E9581", fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  summaryValue: { color: "#F5FFF9", fontSize: 12, fontWeight: "800", marginTop: 5, textTransform: "capitalize" },
  section: { color: "#9AB9A8", fontSize: 11, fontWeight: "900", letterSpacing: 1.4, marginBottom: 12 },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 },
  progressCopy: { color: "#8FB6A2", fontSize: 11, marginTop: -6 },
  progressButton: { minHeight: 42, borderRadius: 12, borderWidth: 1, borderColor: "#3B7555", justifyContent: "center", paddingHorizontal: 12 },
  progressButtonText: { color: "#7AF5B8", fontSize: 11, fontWeight: "900" },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: "#1E3A31", overflow: "hidden", marginBottom: 16 },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: "#7AF5B8" },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: "#071B16", borderRadius: 19, borderWidth: 1, borderColor: "#1E3A31", padding: 14, marginBottom: 11 },
  cardComplete: { borderColor: "#3B7555", backgroundColor: "#0D2F22" },
  dayCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#11382B", alignItems: "center", justifyContent: "center", marginRight: 12 },
  dayText: { color: "#7AF5B8", fontSize: 15, fontWeight: "900" },
  cardBody: { flex: 1 },
  cardMeta: { color: "#7AF5B8", fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
  cardTitle: { color: "#F5FFF9", fontSize: 16, fontWeight: "900", marginTop: 4 },
  cardDescription: { color: "#A7CBB7", fontSize: 12, lineHeight: 17, marginTop: 5 },
  connection: { color: "#6E9581", fontSize: 10, fontWeight: "700", marginTop: 6 },
  arrow: { color: "#7AF5B8", fontSize: 26, marginLeft: 8 },
  proofCard: { backgroundColor: "rgba(122,245,184,0.08)", borderWidth: 1, borderColor: "rgba(122,245,184,0.22)", borderRadius: 18, padding: 16, marginTop: 12 },
  proofTitle: { color: "#7AF5B8", fontSize: 15, fontWeight: "900", marginBottom: 6 },
  proofText: { color: "#C8EED9", fontSize: 13, lineHeight: 20 },
  footer: { position: "absolute", left: 22, right: 22, bottom: 22 },
  button: { height: 58, borderRadius: 29, backgroundColor: "#7AF5B8", alignItems: "center", justifyContent: "center" },
  buttonText: { color: "#010807", fontSize: 17, fontWeight: "900" },
});
