import React, { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";

import {
  RISEProgress,
  buildProgressSummary,
  createDefaultProgress,
} from "../../services/progressEngine";
import { progressRepository } from "../../services/progressRepository";
import {
  COIN_REWARDS,
  CoinReward,
  loadRedemptions,
  redeemCoinReward,
} from "../../services/rewards";
import { createSevenDayPlan, loadProfile, RiseProfile } from "../../services/personalization";
import { missionRepository, MissionRecord } from "../../services/missionRepository";

export default function ProgressTabScreen() {
  const [progress, setProgress] = useState<RISEProgress>(createDefaultProgress());
  const [redeemed, setRedeemed] = useState<string[]>([]);
  const [profile, setProfile] = useState<RiseProfile | null>(null);
  const [missionRecords, setMissionRecords] = useState<MissionRecord[]>([]);

  useFocusEffect(React.useCallback(() => {
    let active = true;
    const loadProgress = async () => {
      const [storedProgress, storedRedemptions, storedProfile, storedMissions] = await Promise.all([
        progressRepository.load(),
        loadRedemptions(),
        loadProfile(),
        missionRepository.list(),
      ]);
      if (active) {
        setProgress(storedProgress);
        setRedeemed(storedRedemptions);
        setProfile(storedProfile);
        setMissionRecords(storedMissions);
      }
    };

    loadProgress();
    return () => { active = false; };
  }, []));

  const adaptiveSummary = useMemo(
    () => buildProgressSummary(progress, "personal"),
    [progress]
  );

  const achievements = useMemo(() => adaptiveSummary.achievements, [adaptiveSummary]);
  const milestones = useMemo(() => adaptiveSummary.milestones, [adaptiveSummary]);
  const streakCount = useMemo(() => adaptiveSummary.streak, [adaptiveSummary]);
  const cycleMissionIds = profile ? createSevenDayPlan(profile).map((mission) => mission.id) : [];
  const cycleTotal = cycleMissionIds.length || 7;
  const cycleCompleted = missionRecords.filter((record) => record.status === "completed" && cycleMissionIds.includes(record.missionId)).length;
  const completedRecords = missionRecords.filter((record) => record.status === "completed");
  const feedbackRecords = missionRecords.filter((record) => record.feedback?.difficulty || typeof record.feedback?.useful === "boolean");
  const usefulCount = feedbackRecords.filter((record) => record.feedback?.useful === true).length;
  const hardCount = feedbackRecords.filter((record) => record.feedback?.difficulty === "too_hard").length;
  const photoCount = completedRecords.filter((record) => record.proof?.type === "photo").length;
  const videoCount = completedRecords.filter((record) => record.proof?.type === "video").length;
  const cyclePercent = Math.min(100, Math.round((cycleCompleted / cycleTotal) * 100));
  const reviewInsight = hardCount > Math.max(1, feedbackRecords.length / 2)
    ? "Your recent missions have felt demanding. RISE is reducing the next step and adding more guidance."
    : usefulCount > 0
      ? `${usefulCount} mission${usefulCount === 1 ? " was" : "s were"} marked useful. Your next cycle will keep emphasizing practical work.`
      : "Complete a mission and rate it so RISE can tune your next challenge.";

  const redeem = async (reward: CoinReward) => {
    const result = await redeemCoinReward(reward);
    if (!result.ok) {
      Alert.alert(
        result.reason === "already" ? "Already unlocked" : "Keep earning",
        result.reason === "already"
          ? "This reward is already yours."
          : `You need ${reward.cost - result.progress.coins} more coins.`
      );
      return;
    }
    setProgress(result.progress);
    setRedeemed(result.redeemed);
    Alert.alert("Reward unlocked", reward.description);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topBar}><Text style={styles.logo}>RISE</Text><Pressable accessibilityRole="button" accessibilityLabel="Open settings" onPress={() => router.push("/settings" as any)} style={styles.settingsButton}><Text style={styles.settingsText}>Settings</Text></Pressable></View>
      <Text style={styles.heading}>Progress</Text>
      <Text style={styles.subtitle}>Your momentum, milestones, and growth story.</Text>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>CURRENT STATUS</Text>
        <Text style={styles.summaryTitle}>{profile?.customGoal || "Personal Growth"}</Text>
        <Text style={styles.summaryText}>Building {profile?.weeklySkill || adaptiveSummary.currentSkill?.name || "Foundations"} • {cycleCompleted}/{cycleTotal} missions proved</Text>
      </View>

      <View style={styles.gridRow}>
        <View style={styles.smallCard}>
          <Text style={styles.smallLabel}>TOTAL XP</Text>
          <Text style={styles.smallValue}>{progress.totalXP}</Text>
        </View>
        <View style={styles.smallCard}>
          <Text style={styles.smallLabel}>STREAK</Text>
          <Text style={styles.smallValue}>{streakCount} days</Text>
        </View>
      </View>

      <View style={styles.reviewCard}>
        <View style={styles.reviewHeader}><View><Text style={styles.sectionTitle}>YOUR CYCLE REVIEW</Text><Text style={styles.reviewTitle}>{cyclePercent}% complete</Text></View><Text style={styles.reviewProof}>{photoCount} photos · {videoCount} videos</Text></View>
        <View style={styles.track}><View style={[styles.trackFill, { width: `${cyclePercent}%` }]} /></View>
        <Text style={styles.reviewInsight}>{reviewInsight}</Text>
        <View style={styles.skillWrap}>{profile?.focusSkills?.map((skill, index) => <View key={skill} style={styles.skillPill}><Text style={styles.skillText}>{index === 0 ? `Primary · ${skill}` : skill}</Text></View>)}</View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>CYCLE BADGES</Text>
        {(profile?.cycleBadges || []).length ? profile!.cycleBadges!.map((badge) => <View key={badge} style={styles.listItem}><Text style={styles.listEmoji}>🏅</Text><View style={styles.listTextWrap}><Text style={styles.listTitle}>{badge}</Text><Text style={styles.listSubtitle}>Earned by passing a cycle quiz at 80% or higher.</Text></View></View>) : <Text style={styles.emptyState}>Complete your cycle and pass its quiz to earn your first badge.</Text>}
        <Text style={styles.benchmarkNote}>RISE compares you with your own previous work in this private beta. A public leaderboard would require informed consent, anti-cheat controls, moderation, and anonymized server data, so the app does not invent rankings.</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.rewardHeader}>
          <Text style={styles.sectionTitle}>COIN REWARDS</Text>
          <Text style={styles.coinBalance}>{progress.coins} 🪙</Text>
        </View>
        <Text style={styles.rewardIntro}>Small rewards for real proof of work.</Text>
        {COIN_REWARDS.map((reward) => {
          const unlocked = redeemed.includes(reward.id);
          const canAfford = progress.coins >= reward.cost;
          return (
            <View key={reward.id} style={styles.rewardCard}>
              <Text style={styles.rewardEmoji}>{reward.emoji}</Text>
              <View style={styles.rewardBody}>
                <Text style={styles.rewardTitle}>{reward.title}</Text>
                <Text style={styles.rewardDescription}>{reward.description}</Text>
              </View>
              <Pressable
                onPress={() => redeem(reward)}
                disabled={unlocked}
                style={[styles.redeemButton, (!canAfford || unlocked) && styles.redeemDisabled]}
              >
                <Text style={styles.redeemText}>{unlocked ? "Owned" : `${reward.cost} 🪙`}</Text>
              </Pressable>
            </View>
          );
        })}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ACHIEVEMENTS</Text>
        {achievements.length > 0 ? (
          achievements.map((achievement) => (
            <View key={achievement.title} style={styles.listItem}>
              <Text style={styles.listEmoji}>•</Text>
              <View style={styles.listTextWrap}>
                <Text style={styles.listTitle}>{achievement.title}</Text>
                <Text style={styles.listSubtitle}>{achievement.description}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyState}>No achievements yet — keep building your streak.</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>MILESTONES</Text>
        {milestones.length > 0 ? (
          milestones.map((milestone) => (
            <View key={milestone.title} style={styles.listItem}>
              <Text style={styles.listEmoji}>•</Text>
              <View style={styles.listTextWrap}>
                <Text style={styles.listTitle}>{milestone.title}</Text>
                <Text style={styles.listSubtitle}>Target: {milestone.requirement}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyState}>Milestones will appear as you gain momentum.</Text>
        )}
      </View>
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
    marginBottom: 0,
  },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  benchmarkNote: { color: "#789886", fontSize: 10, lineHeight: 16, marginTop: 10 },
  settingsButton: { minHeight: 42, borderRadius: 21, borderWidth: 1, borderColor: "#29483B", paddingHorizontal: 14, alignItems: "center", justifyContent: "center" },
  settingsText: { color: "#BDEFD3", fontSize: 11, fontWeight: "900" },
  heading: {
    fontSize: 34,
    fontWeight: "900",
    color: "#F5FFF9",
    marginBottom: 8,
  },
  subtitle: {
    color: "#C8EED9",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: "#0D2F22",
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: "#1E3A31",
    marginBottom: 18,
  },
  summaryLabel: {
    color: "#7AF5B8",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  summaryTitle: {
    color: "#F5FFF9",
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 8,
  },
  summaryText: {
    color: "#C8EED9",
    fontSize: 14,
    lineHeight: 20,
  },
  gridRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 18,
  },
  smallCard: {
    flex: 1,
    backgroundColor: "#071B16",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#1E3A31",
  },
  smallLabel: {
    color: "#B4D4C2",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
    marginBottom: 8,
  },
  smallValue: {
    color: "#F5FFF9",
    fontSize: 22,
    fontWeight: "900",
  },
  section: {
    backgroundColor: "#071B16",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#1E3A31",
    padding: 18,
    marginBottom: 18,
  },
  sectionTitle: {
    color: "#7AF5B8",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0F1E1A",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  listEmoji: {
    fontSize: 22,
    marginRight: 12,
  },
  listTextWrap: {
    flex: 1,
  },
  listTitle: {
    color: "#F5FFF9",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 2,
  },
  listSubtitle: {
    color: "#C8EED9",
    fontSize: 12,
    lineHeight: 17,
  },
  emptyState: {
    color: "#B4D4C2",
    fontSize: 14,
    lineHeight: 20,
  },
  reviewCard: { backgroundColor: "#0D2F22", borderRadius: 20, padding: 18, borderWidth: 1, borderColor: "#295441", marginBottom: 18 },
  reviewHeader: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  reviewTitle: { color: "#F5FFF9", fontSize: 23, fontWeight: "900" },
  reviewProof: { color: "#8FB6A2", fontSize: 10, fontWeight: "800", textAlign: "right" },
  track: { height: 8, borderRadius: 4, overflow: "hidden", backgroundColor: "#071B16", marginTop: 15 },
  trackFill: { height: 8, borderRadius: 4, backgroundColor: "#7AF5B8" },
  reviewInsight: { color: "#DFFDEE", fontSize: 13, lineHeight: 20, marginTop: 13 },
  skillWrap: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 13 },
  skillPill: { borderRadius: 999, backgroundColor: "#11382B", paddingHorizontal: 10, paddingVertical: 7 },
  skillText: { color: "#BDEFD3", fontSize: 10, fontWeight: "800" },
  rewardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  coinBalance: { color: "#F5FFF9", fontSize: 14, fontWeight: "900", marginBottom: 12 },
  rewardIntro: { color: "#8FB6A2", fontSize: 12, marginBottom: 12 },
  rewardCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#0F1E1A", borderRadius: 14, padding: 12, marginBottom: 10 },
  rewardEmoji: { fontSize: 24, marginRight: 10 },
  rewardBody: { flex: 1, paddingRight: 8 },
  rewardTitle: { color: "#F5FFF9", fontSize: 14, fontWeight: "900" },
  rewardDescription: { color: "#A7CBB7", fontSize: 11, lineHeight: 16, marginTop: 3 },
  redeemButton: { minWidth: 68, borderRadius: 12, backgroundColor: "#7AF5B8", paddingHorizontal: 10, paddingVertical: 9, alignItems: "center" },
  redeemDisabled: { opacity: 0.45 },
  redeemText: { color: "#010807", fontSize: 11, fontWeight: "900" },
});
