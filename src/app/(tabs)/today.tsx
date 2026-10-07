import React, { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";

import {
  RISEProgress,
  buildProgressSummary,
  createDefaultProgress,
  getCurrentSkill,
  getCurrentLevelXP,
  getNextUnlock,
  getXPForNextLevel,
} from "../../services/progressEngine";
import { progressRepository } from "../../services/progressRepository";
import {
  createSevenDayPlan,
  loadProfile,
  RiseProfile,
} from "../../services/personalization";
import { getReminderState, ReminderState } from "../../services/reminders";
import { AppPageHeader } from "../../components/appPageHeader";
import { getUnlockedDay } from "../../services/dayUnlock";
import { getCurrentUser, RiseUser } from "../../services/auth";

export default function TodayTabScreen() {
  const [progress, setProgress] = useState<RISEProgress>(createDefaultProgress());
  const [profile, setProfile] = useState<RiseProfile | null>(null);
  const [reminder, setReminder] = useState<ReminderState | null>(null);
  const [user, setUser] = useState<RiseUser | null>(null);

  useFocusEffect(useCallback(() => {
    let active = true;
    void Promise.all([progressRepository.load(), loadProfile(), getReminderState(), getCurrentUser().catch(() => null)]).then(([storedProgress, storedProfile, reminderState, storedUser]) => {
      if (!active) return;
      setProgress(storedProgress);
      setProfile(storedProfile);
      setReminder(reminderState);
      setUser(storedUser);
    });
    return () => { active = false; };
  }, []));

  const adaptiveSummary = useMemo(
    () => buildProgressSummary(progress, "personal"),
    [progress]
  );

  const currentSkill = useMemo(() => getCurrentSkill(progress.skills), [progress.skills]);
  const nextUnlock = useMemo(() => getNextUnlock(progress.skills), [progress.skills]);

  const currentLevelXP = getCurrentLevelXP(progress.totalXP);
  const nextLevelXP = getXPForNextLevel(progress.level);
  const levelProgress = Math.min(currentLevelXP / Math.max(nextLevelXP, 1), 1);

  const todayMission = useMemo(() => {
    if (!profile) return null;
    const plan = createSevenDayPlan(profile);
    return plan[getUnlockedDay(profile.skillStartDate, plan.length) - 1] || plan[0];
  }, [profile]);
  const todayComplete = Boolean(todayMission && progress.events.some((event) => event.title.includes(todayMission.title)));
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : hour < 21 ? "Good evening" : "Good night";
  const firstName = user?.display_name.trim().split(/\s+/)[0];
  const shortMission = (todayMission?.description || adaptiveSummary.recommendation.description).split(/(?<=[.!?])\s+/)[0];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <AppPageHeader showTour />
      <Text style={styles.greeting}>{greeting}{firstName ? `, ${firstName}` : ""} 👋</Text>
      <View style={styles.goalChip}><Text style={styles.goalChipIcon}>🎯</Text><Text style={styles.goalText} numberOfLines={1}>{profile?.customGoal || currentSkill?.goal || "Personal Growth"}</Text></View>

      <View style={styles.levelStrip}>
        <View><Text style={styles.statValue}>{progress.level}</Text><Text style={styles.statLabel}>LEVEL</Text></View>
        <View style={styles.statDivider} />
        <View><Text style={styles.statValue}>{progress.totalXP}</Text><Text style={styles.statLabel}>XP</Text></View>
        <View style={styles.levelTrack}><View style={[styles.progressFill, { width: `${levelProgress * 100}%` }]} /></View>
        <Text style={styles.levelLeft}>{Math.max(nextLevelXP - currentLevelXP, 0)} to go</Text>
      </View>

      <View style={styles.primaryCard}>
        <View style={styles.missionTop}><Text style={styles.missionEmoji}>⚡</Text><Text style={styles.cardEyebrow}>TODAY&apos;S RISE {todayMission ? `• ${todayMission.track.toUpperCase()}` : ""}</Text></View>
        <Text style={styles.primaryTitle}>{todayMission?.title || adaptiveSummary.recommendation.title}</Text>
        <Text style={styles.primaryDescription}>{shortMission}</Text>
        <View style={styles.primaryMetaRow}>
          <Text style={styles.metaPill}>⏱ {todayMission?.duration || 30} min</Text>
          <Text style={styles.metaPill}>✨ +{todayMission?.reward || 30} XP</Text>
          <Text style={styles.metaPill}>🎓 {todayMission?.focusSkill || todayMission?.skills[0] || currentSkill?.name || "Foundations"}</Text>
        </View>
        <Pressable
          style={[styles.primaryButton, todayComplete && styles.primaryButtonComplete]}
          disabled={todayComplete}
          onPress={() => router.push({ pathname: "/action", params: todayMission ? { mission: JSON.stringify(todayMission) } : {} } as any)}
        >
          <Text style={styles.primaryButtonText}>{todayComplete ? "✓ Done today — see you tomorrow" : "Start mission →"}</Text>
        </Pressable>
      </View>

      <Text style={styles.quickLabel}>QUICK START</Text>
      <View style={styles.quickRow}>
        <Pressable style={styles.quickCard} onPress={() => router.push("/(tabs)/learn" as any)}><Text style={styles.quickEmoji}>📖</Text><Text style={styles.quickTitle}>Learn</Text><Text style={styles.quickText}>One useful idea</Text></Pressable>
        <Pressable style={styles.quickCard} onPress={() => router.push("/(tabs)/progress" as any)}><Text style={styles.quickEmoji}>📈</Text><Text style={styles.quickTitle}>Progress</Text><Text style={styles.quickText}>See your wins</Text></Pressable>
      </View>

      <Pressable style={styles.reminderRow} accessibilityRole="button" onPress={() => router.push("/settings" as never)}>
        <Text style={styles.reminderIcon}>{reminder?.enabled ? "🔔" : "🔕"}</Text>
        <Text style={styles.reminderText}>{reminder?.enabled ? `Reminder set for ${reminder.time}` : "Turn on a daily reminder"}</Text>
        <Text style={styles.reminderAction}>›</Text>
      </Pressable>

      <Text style={styles.nextUnlock}>Next unlock: {nextUnlock?.name || "Keep building"}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#010807",
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 68,
    paddingBottom: 120,
  },
  greeting: {
    fontSize: 34,
    fontWeight: "900",
    color: "#F5FFF9",
    marginBottom: 8,
  },
  goalChip: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", maxWidth: "100%", backgroundColor: "#0C241B", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 9, marginBottom: 16 },
  goalChipIcon: { fontSize: 13, marginRight: 7 },
  goalText: {
    color: "#F5FFF9",
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "800",
  },
  levelStrip: { flexDirection: "row", alignItems: "center", backgroundColor: "#071B16", borderRadius: 18, padding: 14, borderWidth: 1, borderColor: "#1E3A31", marginBottom: 16, gap: 10 },
  statValue: { color: "#F5FFF9", fontSize: 18, fontWeight: "900" },
  statLabel: { color: "#779987", fontSize: 8, fontWeight: "900", letterSpacing: 1 },
  statDivider: { width: 1, height: 30, backgroundColor: "#29483B" },
  levelTrack: { flex: 1, height: 8, backgroundColor: "#1B2B26", borderRadius: 10, overflow: "hidden" },
  progressFill: {
    height: "100%",
    backgroundColor: "#19A463",
    borderRadius: 10,
  },
  levelLeft: { color: "#8FB6A2", fontSize: 10, fontWeight: "800" },
  primaryCard: {
    backgroundColor: "#0D2F22",
    borderRadius: 26,
    padding: 20,
    borderWidth: 1,
    borderColor: "#1E3A31",
    marginBottom: 20,
  },
  cardEyebrow: {
    color: "#7AF5B8",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  missionTop: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  missionEmoji: { fontSize: 18 },
  primaryTitle: {
    color: "#F5FFF9",
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 8,
  },
  primaryDescription: {
    color: "#C8EED9",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  primaryMetaRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    gap: 8,
    marginBottom: 18,
    flexWrap: "wrap",
  },
  metaPill: { color: "#DFFDEE", fontSize: 11, fontWeight: "800", backgroundColor: "#164A37", borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6 },
  primaryButton: {
    backgroundColor: "#7AF5B8",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryButtonComplete: { backgroundColor: "#315544" },
  primaryButtonText: {
    color: "#010807",
    fontSize: 15,
    fontWeight: "900",
  },
  quickLabel: { color: "#789886", fontSize: 9, fontWeight: "900", letterSpacing: 1.4, marginBottom: 9 },
  quickRow: { flexDirection: "row", gap: 11, marginBottom: 13 },
  quickCard: { flex: 1, backgroundColor: "#071B16", borderRadius: 18, borderWidth: 1, borderColor: "#1E3A31", padding: 15 },
  quickEmoji: { fontSize: 20 },
  quickTitle: { color: "#F5FFF9", fontSize: 15, fontWeight: "900", marginTop: 8 },
  quickText: { color: "#8FB6A2", fontSize: 11, marginTop: 3 },
  reminderRow: { minHeight: 54, flexDirection: "row", alignItems: "center", backgroundColor: "#071B16", borderRadius: 16, paddingHorizontal: 15, marginBottom: 12 },
  reminderIcon: { fontSize: 17, marginRight: 10 },
  reminderText: { flex: 1, color: "#C8EED9", fontSize: 12, fontWeight: "800" },
  reminderAction: { color: "#7AF5B8", fontSize: 22, fontWeight: "900" },
  nextUnlock: { color: "#668A78", fontSize: 10, textAlign: "center" },
});
