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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { hasCompletedRequiredTour } from "../services/tourState";
import { daysUntilMission, getAvailableMissionDay, isMissionAvailable } from "../services/dayUnlock";
import { useRiseAppearance } from "../services/appearance";

const valueOf = (value: string | string[] | undefined, fallback = "") =>
  Array.isArray(value) ? value[0] || fallback : value || fallback;

export default function PlanScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useRiseAppearance();
  const params = useLocalSearchParams();
  const [savedProfile, setSavedProfile] = useState<RiseProfile | null>(null);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const hasPlanParams = Boolean(params.goals || params.customGoal || params.weeklySkill);

  const paramProfile = useMemo<RiseProfile>(() => {
    let goals = ["personal"];
    try {
      const parsed = JSON.parse(valueOf(params.goals, "[]"));
      if (Array.isArray(parsed) && parsed.length) goals = parsed.slice(0, 64).map(String);
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
    void Promise.all([loadProfile(), missionRepository.list(), hasCompletedRequiredTour()]).then(([storedProfile, records, tourComplete]) => {
      if (!active) return;
      if (!tourComplete) {
        router.replace({ pathname: "/tour", params: { required: "1" } } as never);
        return;
      }
      setSavedProfile(storedProfile);
      setCompletedIds(records.filter((record) => record.status === "completed").map((record) => record.missionId));
    });
    return () => { active = false; };
  }, []));

  const profile = hasPlanParams ? paramProfile : savedProfile;
  const missions = useMemo(() => profile ? createSevenDayPlan(profile) : [], [profile]);
  const completedCount = missions.filter((mission) => completedIds.includes(mission.id)).length;
  const completedDays = missions.filter((mission) => completedIds.includes(mission.id)).map((mission) => mission.day);
  const availableDay = getAvailableMissionDay(profile?.skillStartDate, missions.length || 1, completedDays);
  const activeMission = missions[availableDay - 1];
  const activeMissionComplete = Boolean(activeMission && completedIds.includes(activeMission.id));

  const openMission = (mission: PersonalizedMission) => {
    if (!isMissionAvailable(mission.day, profile?.skillStartDate, missions.length || 1, completedDays)) return;
    router.push({
      pathname: "/action",
      params: { mission: JSON.stringify(mission) },
    } as any);
  };

  if (!profile) return <View style={[styles.loading, { backgroundColor: theme.background }]}><ActivityIndicator color={theme.accent} /></View>;

  return (
    <View style={[styles.page, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 120 }]} showsVerticalScrollIndicator={false}>
        <Text style={[styles.eyebrow, { color: theme.accent }]}>YOUR PERSONAL 1% SYSTEM</Text>
        <Text accessibilityRole="header" style={[styles.title, { color: theme.text }]}>
          One direction.{"\n"}<Text style={{ color: theme.accent }}>Seven focused wins.</Text>
        </Text>
        <Text style={[styles.subtitle, { color: theme.muted }]}>
          RISE turns “{profile.customGoal}” into one guided {profile.weeklySkill} mission per day. Finish today before tomorrow opens.
        </Text>

        <View style={[styles.summary, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View>
            <Text style={[styles.summaryLabel, { color: theme.muted }]}>SKILL</Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>{profile.weeklySkill}</Text>
          </View>
          <View>
            <Text style={[styles.summaryLabel, { color: theme.muted }]}>CYCLE</Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>{profile.commitment}</Text>
          </View>
          <View>
            <Text style={[styles.summaryLabel, { color: theme.muted }]}>DAILY</Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>{profile.availableTime}</Text>
          </View>
        </View>

        <View style={styles.sectionRow}>
          <View><Text style={[styles.section, { color: theme.muted }]}>YOUR {missions.length}-DAY PATH</Text><Text style={[styles.progressCopy, { color: theme.muted }]}>{completedCount} of {missions.length} missions complete</Text></View>
          <Pressable accessibilityRole="button" onPress={() => router.push("/(tabs)/progress" as never)} style={({ pressed }) => [styles.progressButton, { borderColor: theme.border }, pressed && styles.pressed]}><Text style={[styles.progressButtonText, { color: theme.accent }]}>View progress ↗</Text></Pressable>
        </View>
        <View style={[styles.progressTrack, { backgroundColor: theme.surfaceStrong }]}><View style={[styles.progressFill, { backgroundColor: theme.accent, width: `${missions.length ? completedCount / missions.length * 100 : 0}%` }]} /></View>
        {missions.map((mission) => {
          const completed = completedIds.includes(mission.id);
          const available = isMissionAvailable(mission.day, profile.skillStartDate, missions.length || 1, completedDays);
          const active = mission.day === availableDay && !completed;
          const waitDays = daysUntilMission(mission.day, availableDay);
          const stateLabel = completed ? "COMPLETE" : active ? "TODAY" : available ? "AVAILABLE" : waitDays === 1 ? "TOMORROW" : `IN ${waitDays} DAYS`;
          return (
          <Pressable
            key={mission.id}
            accessibilityRole="button"
            accessibilityLabel={`Day ${mission.day}: ${mission.title}. ${stateLabel.toLowerCase()}.`}
            accessibilityState={{ disabled: !available }}
            disabled={!available}
            style={({ pressed }) => [styles.card, { backgroundColor: theme.surface, borderColor: active ? theme.accent : theme.border }, completed && { backgroundColor: theme.surfaceStrong, borderColor: theme.accent }, !available && styles.cardLocked, pressed && styles.pressed]}
            onPress={() => openMission(mission)}
          >
            <View style={[styles.dayCircle, { backgroundColor: available ? theme.surfaceStrong : theme.background }]}><Text style={[styles.dayText, { color: available ? theme.accent : theme.muted }]}>{completed ? "✓" : mission.day}</Text></View>
            <View style={styles.cardBody}>
              <Text style={[styles.cardMeta, { color: available ? theme.accent : theme.muted }]}>DAY {mission.day} • {mission.duration} MIN • {stateLabel}</Text>
              <Text style={[styles.cardTitle, { color: theme.text }]}>{mission.title}</Text>
              {available ? <Text style={[styles.skillLabel, { color: theme.text, backgroundColor: theme.surfaceStrong }]}>{mission.focusSkill}</Text> : null}
              {active || completed ? <Text style={[styles.cardDescription, { color: theme.muted }]} numberOfLines={2}>{mission.description}</Text> : null}
              <Text style={[styles.connection, { color: theme.muted }]}>{completed ? "Saved in your progress" : active ? "Your one mission for today" : available ? "Ready when you are" : waitDays === 1 ? "Opens tomorrow after today is complete" : `Opens in ${waitDays} days after earlier missions`}</Text>
            </View>
            <Text style={[styles.arrow, { color: available ? theme.accent : theme.muted }]}>{available ? "›" : "•"}</Text>
          </Pressable>
        );})}

        <View style={[styles.proofCard, { backgroundColor: theme.surfaceStrong, borderColor: theme.border }]}>
          <Text style={[styles.proofTitle, { color: theme.accent }]}>Earn progress by doing the work</Text>
          <Text style={[styles.proofText, { color: theme.text }]}>
            Complete the mission, add proof, and write the short reflection. RISE saves every finished step.
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { bottom: insets.bottom + 12 }]}>
        <Pressable accessibilityRole="button" accessibilityState={{ disabled: activeMissionComplete }} disabled={activeMissionComplete} style={({ pressed }) => [styles.button, { backgroundColor: theme.accent }, activeMissionComplete && styles.buttonDisabled, pressed && styles.pressed]} onPress={() => activeMission ? openMission(activeMission) : router.push("/(tabs)/progress" as never)}>
          <Text style={[styles.buttonText, { color: theme.accentInk }]}>{activeMissionComplete ? "Today complete — return tomorrow" : activeMission ? `${completedCount ? "Continue" : "Start"} Day ${activeMission.day} →` : "View my progress →"}</Text>
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
  cardLocked: { opacity: .58 },
  dayCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#11382B", alignItems: "center", justifyContent: "center", marginRight: 12 },
  dayText: { color: "#7AF5B8", fontSize: 15, fontWeight: "900" },
  cardBody: { flex: 1 },
  cardMeta: { color: "#7AF5B8", fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
  cardTitle: { color: "#F5FFF9", fontSize: 16, fontWeight: "900", marginTop: 4 },
  skillLabel: { alignSelf: "flex-start", color: "#D8FFE9", backgroundColor: "#164A37", borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4, fontSize: 10, fontWeight: "900", marginTop: 7 },
  cardDescription: { color: "#A7CBB7", fontSize: 12, lineHeight: 17, marginTop: 5 },
  connection: { color: "#6E9581", fontSize: 10, fontWeight: "700", marginTop: 6 },
  arrow: { color: "#7AF5B8", fontSize: 26, marginLeft: 8 },
  proofCard: { backgroundColor: "rgba(122,245,184,0.08)", borderWidth: 1, borderColor: "rgba(122,245,184,0.22)", borderRadius: 18, padding: 16, marginTop: 12 },
  proofTitle: { color: "#7AF5B8", fontSize: 15, fontWeight: "900", marginBottom: 6 },
  proofText: { color: "#C8EED9", fontSize: 13, lineHeight: 20 },
  footer: { position: "absolute", left: 22, right: 22, bottom: 22 },
  button: { height: 58, borderRadius: 29, backgroundColor: "#7AF5B8", alignItems: "center", justifyContent: "center" },
  buttonDisabled: { opacity: .58 },
  buttonText: { color: "#010807", fontSize: 17, fontWeight: "900" },
});
