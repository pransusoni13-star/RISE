import React, { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";

import {
  RISEProgress,
  buildProgressSummary,
  createDefaultProgress,
  getCurrentSkill,
  getNextUnlock,
  getWeakestSkill,
  getStrongestSkill,
} from "../../services/progressEngine";
import { progressRepository } from "../../services/progressRepository";
import {
  createSevenDayPlan,
  loadProfile,
  RiseProfile,
} from "../../services/personalization";

export default function TodayTabScreen() {
  const [progress, setProgress] = useState<RISEProgress>(createDefaultProgress());
  const [profile, setProfile] = useState<RiseProfile | null>(null);

  useEffect(() => {
    const loadProgress = async () => {
      const [storedProgress, storedProfile] = await Promise.all([
        progressRepository.load(),
        loadProfile(),
      ]);
      setProgress(storedProgress);
      setProfile(storedProfile);
    };

    loadProgress();
  }, []);

  const adaptiveSummary = useMemo(
    () => buildProgressSummary(progress, "personal"),
    [progress]
  );

  const currentSkill = useMemo(() => getCurrentSkill(progress.skills), [progress.skills]);
  const nextUnlock = useMemo(() => getNextUnlock(progress.skills), [progress.skills]);
  const weakestSkill = useMemo(() => getWeakestSkill(progress.skills), [progress.skills]);
  const strongestSkill = useMemo(() => getStrongestSkill(progress.skills), [progress.skills]);

  const currentLevelXP = progress.events.reduce((total, event) => total + event.amount, 0);
  const nextLevelXP = 100 + (progress.level - 1) * 50;
  const levelProgress = Math.min(currentLevelXP / Math.max(nextLevelXP, 1), 1);

  const todayMission = useMemo(() => {
    if (!profile) return null;
    const plan = createSevenDayPlan(profile);
    return plan.find((mission) =>
      !progress.events.some((event) => event.title.includes(mission.title))
    ) || plan[plan.length - 1];
  }, [profile, progress.events]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.logo}>RISE</Text>
      <Text style={styles.greeting}>Good morning.</Text>
      <Text style={styles.goalLabel}>YOUR GOAL</Text>
      <Text style={styles.goalText}>{profile?.customGoal || currentSkill?.goal || "Personal Growth"}</Text>

      <View style={styles.levelCard}>
        <Text style={styles.levelLabel}>LEVEL {progress.level}</Text>
        <Text style={styles.xpText}>{progress.totalXP} XP</Text>
        <View style={styles.progressBackground}>
          <View style={[styles.progressFill, { width: `${levelProgress * 100}%` }]} />
        </View>
        <Text style={styles.nextLevel}>{Math.max(nextLevelXP - currentLevelXP, 0)} XP until next level</Text>
      </View>

      <View style={styles.primaryCard}>
        <Text style={styles.cardEyebrow}>TODAY&apos;S RISE</Text>
        <Text style={styles.primaryTitle}>{todayMission?.title || adaptiveSummary.recommendation.title}</Text>
        <Text style={styles.primaryDescription}>{todayMission?.description || adaptiveSummary.recommendation.description}</Text>
        <View style={styles.primaryMetaRow}>
          <Text style={styles.metaText}>{todayMission?.duration || 30} min</Text>
          <Text style={styles.metaText}>+{todayMission?.reward || 30} XP</Text>
          <Text style={styles.metaText}>{todayMission?.skills[0] || currentSkill?.name || "Foundations"}</Text>
        </View>
        <Pressable
          style={styles.primaryButton}
          onPress={() => router.push({ pathname: "/action", params: todayMission ? { mission: JSON.stringify(todayMission) } : {} } as any)}
        >
          <Text style={styles.primaryButtonText}>Start Mission</Text>
        </Pressable>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>YOUR PATH</Text>
      </View>

      <View style={styles.pathRow}>
        <View style={styles.pathStep}><Text style={styles.pathStepText}>Learn</Text></View>
        <Text style={styles.pathArrow}>→</Text>
        <View style={styles.pathStep}><Text style={styles.pathStepText}>Quiz</Text></View>
        <Text style={styles.pathArrow}>→</Text>
        <View style={styles.pathStep}><Text style={styles.pathStepText}>Mission</Text></View>
        <Text style={styles.pathArrow}>→</Text>
        <View style={styles.pathStep}><Text style={styles.pathStepText}>Project</Text></View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>WHY THIS?</Text>
        <Text style={styles.infoText}>
          {weakestSkill
            ? `Your weakest skill is ${weakestSkill.name}, so RISE is prioritizing that area before moving you into a bigger challenge.`
            : "RISE is building your momentum with a focused next step."}
        </Text>
      </View>

      <View style={styles.gridRow}>
        <View style={styles.smallCard}>
          <Text style={styles.smallLabel}>CURRENT SKILL</Text>
          <Text style={styles.smallTitle}>{currentSkill?.name || "Foundations"}</Text>
          <Text style={styles.smallMeta}>Level {currentSkill?.level || 1}</Text>
          <Text style={styles.smallMeta}>{currentSkill?.xp || 0} / {currentSkill?.requiredXP || 100} XP</Text>
        </View>

        <View style={styles.smallCard}>
          <Text style={styles.smallLabel}>NEXT UNLOCK</Text>
          <Text style={styles.smallTitle}>{nextUnlock?.name || "Keep building"}</Text>
          <Text style={styles.smallMeta}>{strongestSkill ? `Strongest: ${strongestSkill.name}` : "Consistency"}</Text>
        </View>
      </View>

      <Pressable
        style={styles.secondaryButton}
        onPress={() => router.push("/learning" as any)}
      >
        <Text style={styles.secondaryButtonText}>Continue Learning</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#010807",
  },
  content: {
    padding: 24,
    paddingTop: 68,
    paddingBottom: 120,
  },
  logo: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 5,
    color: "#7AF5B8",
    marginBottom: 16,
  },
  greeting: {
    fontSize: 34,
    fontWeight: "900",
    color: "#F5FFF9",
    marginBottom: 8,
  },
  goalLabel: {
    color: "#7AF5B8",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 5,
  },
  goalText: {
    color: "#F5FFF9",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 20,
  },
  levelCard: {
    backgroundColor: "#071B16",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#1E3A31",
    marginBottom: 20,
  },
  levelLabel: {
    color: "#B4D4C2",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  xpText: {
    color: "#7AF5B8",
    fontSize: 22,
    fontWeight: "900",
    marginTop: 6,
    marginBottom: 12,
  },
  progressBackground: {
    height: 9,
    backgroundColor: "#1B2B26",
    borderRadius: 10,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#19A463",
    borderRadius: 10,
  },
  nextLevel: {
    color: "#B4D4C2",
    fontSize: 12,
    marginTop: 10,
  },
  primaryCard: {
    backgroundColor: "#0D2F22",
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: "#1E3A31",
    marginBottom: 20,
  },
  cardEyebrow: {
    color: "#7AF5B8",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  primaryTitle: {
    color: "#F5FFF9",
    fontSize: 26,
    fontWeight: "900",
    marginBottom: 8,
  },
  primaryDescription: {
    color: "#C8EED9",
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 16,
  },
  primaryMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 18,
    flexWrap: "wrap",
  },
  metaText: {
    color: "#B4D4C2",
    fontSize: 12,
    fontWeight: "700",
  },
  primaryButton: {
    backgroundColor: "#7AF5B8",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#010807",
    fontSize: 15,
    fontWeight: "900",
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionTitle: {
    color: "#7AF5B8",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  pathRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  pathStep: {
    backgroundColor: "#071B16",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1E3A31",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pathStepText: {
    color: "#F5FFF9",
    fontSize: 12,
    fontWeight: "800",
  },
  pathArrow: {
    color: "#7AF5B8",
    fontSize: 16,
    fontWeight: "900",
  },
  infoCard: {
    backgroundColor: "#071B16",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#1E3A31",
    marginBottom: 20,
  },
  infoLabel: {
    color: "#7AF5B8",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  infoText: {
    color: "#C8EED9",
    fontSize: 14,
    lineHeight: 20,
  },
  gridRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  smallCard: {
    flex: 1,
    backgroundColor: "#071B16",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1E3A31",
  },
  smallLabel: {
    color: "#B4D4C2",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.3,
    marginBottom: 8,
  },
  smallTitle: {
    color: "#F5FFF9",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 5,
  },
  smallMeta: {
    color: "#C8EED9",
    fontSize: 12,
    lineHeight: 18,
  },
  secondaryButton: {
    backgroundColor: "#071B16",
    borderWidth: 1,
    borderColor: "#1E3A31",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#F5FFF9",
    fontSize: 15,
    fontWeight: "800",
  },
});
