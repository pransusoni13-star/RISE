import React, { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";

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
import { useRiseAppearance } from "../../services/appearance";

export default function ProgressTabScreen() {
  const { theme } = useRiseAppearance();
  const [progress, setProgress] = useState<RISEProgress>(createDefaultProgress());
  const [redeemed, setRedeemed] = useState<string[]>([]);
  const [profile, setProfile] = useState<RiseProfile | null>(null);
  const [missionRecords, setMissionRecords] = useState<MissionRecord[]>([]);
  const [showRewards, setShowRewards] = useState(false);
  const [showWins, setShowWins] = useState(false);

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

    void loadProgress().catch(() => {
      if (active) Alert.alert("Couldn’t load progress", "Please reopen this screen to try again. Your saved progress has not been changed.");
    });
    return () => { active = false; };
  }, []));

  const adaptiveSummary = useMemo(
    () => buildProgressSummary(progress, profile?.selectedGoals[0] || "personal"),
    [progress, profile]
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
    try {
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
    } catch {
      Alert.alert("Couldn’t save reward", "Please reopen Progress and check your balance before trying again.");
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.heading, { color: theme.text }]}>Your progress</Text>
      <Text style={[styles.subtitle, { color: theme.muted }]}>Every real step adds up.</Text>

      <View style={[styles.summaryCard, { backgroundColor: theme.surfaceStrong, borderColor: theme.border }]}>
        <Text style={[styles.summaryLabel, { color: theme.accent }]}>RIGHT NOW</Text>
        <Text style={[styles.summaryTitle, { color: theme.text }]}>{profile?.customGoal || "Personal Growth"}</Text>
        <Text style={[styles.summaryText, { color: theme.muted }]}>{profile?.weeklySkill || adaptiveSummary.currentSkill?.name || "Foundations"} · {cycleCompleted}/{cycleTotal} missions proved</Text>
      </View>

      <View style={styles.gridRow}>
        <View style={[styles.smallCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.smallLabel, { color: theme.muted }]}>TOTAL XP</Text>
          <Text style={[styles.smallValue, { color: theme.text }]}>{progress.totalXP}</Text>
        </View>
        <View style={[styles.smallCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.smallLabel, { color: theme.muted }]}>STREAK</Text>
          <Text style={[styles.smallValue, { color: theme.text }]}>{streakCount} days</Text>
        </View>
      </View>

      <View style={[styles.reviewCard, { backgroundColor: theme.surfaceStrong, borderColor: theme.border }]}>
        <View style={styles.reviewHeader}><View><Text style={[styles.sectionTitle, { color: theme.accent }]}>THIS CYCLE</Text><Text style={[styles.reviewTitle, { color: theme.text }]}>{cyclePercent}% complete</Text></View><Text style={[styles.reviewProof, { color: theme.muted }]}>{photoCount + videoCount} proofs</Text></View>
        <View style={[styles.track, { backgroundColor: theme.surface }]}><View style={[styles.trackFill, { backgroundColor: theme.accent, width: `${cyclePercent}%` }]} /></View>
        <Text style={[styles.reviewInsight, { color: theme.muted }]}>{reviewInsight}</Text>
        <View style={styles.skillWrap}>{profile?.focusSkills?.map((skill, index) => <View key={skill} style={[styles.skillPill, { backgroundColor: theme.surface }]}><Text style={[styles.skillText, { color: theme.text }]}>{index === 0 ? `Primary · ${skill}` : skill}</Text></View>)}</View>
      </View>

      <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
        <View style={styles.rewardHeader}>
          <Text style={[styles.sectionTitle, { color: theme.accent }]}>REWARDS</Text>
          <Text style={[styles.coinBalance, { color: theme.text }]}>{progress.coins} coins</Text>
        </View>
        <Text style={[styles.rewardIntro, { color: theme.muted }]}>Real work earns coins. Changing your plan will not erase them.</Text>
        {(showRewards ? COIN_REWARDS : COIN_REWARDS.slice(0, 2)).map((reward) => {
          const unlocked = redeemed.includes(reward.id);
          const canAfford = progress.coins >= reward.cost;
          return (
            <View key={reward.id} style={[styles.rewardCard, { backgroundColor: theme.surfaceStrong }]}> 
              <View style={styles.rewardBody}>
                <Text style={[styles.rewardTitle, { color: theme.text }]}>{reward.title}</Text>
                <Text style={[styles.rewardDescription, { color: theme.muted }]} numberOfLines={1}>{reward.description}</Text>
              </View>
              <Pressable
                onPress={() => redeem(reward)}
                disabled={unlocked}
                style={[styles.redeemButton, { backgroundColor: theme.accent }, (!canAfford || unlocked) && styles.redeemDisabled]}
              >
                <Text style={[styles.redeemText, { color: theme.accentInk }]}>{unlocked ? "Owned" : `${reward.cost} coins`}</Text>
              </Pressable>
            </View>
          );
        })}
        {COIN_REWARDS.length > 2 ? <Pressable accessibilityRole="button" onPress={() => setShowRewards((value) => !value)} style={[styles.moreButton, { borderColor: theme.border }]}><Text style={[styles.moreButtonText, { color: theme.text }]}>{showRewards ? "Show less" : `See all ${COIN_REWARDS.length} rewards`} {showRewards ? "↑" : "↓"}</Text></Pressable> : null}
      </View>

      <Pressable accessibilityRole="button" accessibilityState={{ expanded: showWins }} onPress={() => setShowWins((value) => !value)} style={[styles.winsToggle, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
        <View><Text style={[styles.winsToggleLabel, { color: theme.accent }]}>BADGES & MILESTONES</Text><Text style={[styles.winsToggleValue, { color: theme.text }]}>{(profile?.cycleBadges || []).length + achievements.length} unlocked</Text></View>
        <Text style={[styles.winsToggleArrow, { color: theme.accent }]}>{showWins ? "↑" : "↓"}</Text>
      </Pressable>

      {showWins ? <>
      <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
        <Text style={[styles.sectionTitle, { color: theme.accent }]}>BADGES</Text>
        {(profile?.cycleBadges || []).length ? profile!.cycleBadges!.map((badge) => <View key={badge} style={[styles.listItem, { backgroundColor: theme.surfaceStrong }]}><View style={styles.listTextWrap}><Text style={[styles.listTitle, { color: theme.text }]}>{badge}</Text><Text style={[styles.listSubtitle, { color: theme.muted }]}>Cycle quiz passed.</Text></View></View>) : <Text style={[styles.emptyState, { color: theme.muted }]}>Pass a cycle quiz to earn your first badge.</Text>}
      </View>

      <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
        <Text style={[styles.sectionTitle, { color: theme.accent }]}>ACHIEVEMENTS</Text>
        {achievements.length > 0 ? (
          achievements.map((achievement) => (
            <View key={achievement.title} style={[styles.listItem, { backgroundColor: theme.surfaceStrong }]}> 
              <View style={styles.listTextWrap}>
                <Text style={[styles.listTitle, { color: theme.text }]}>{achievement.title}</Text>
                <Text style={[styles.listSubtitle, { color: theme.muted }]}>{achievement.description}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={[styles.emptyState, { color: theme.muted }]}>Your first achievement is close.</Text>
        )}
      </View>

      <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
        <Text style={[styles.sectionTitle, { color: theme.accent }]}>MILESTONES</Text>
        {milestones.length > 0 ? (
          milestones.map((milestone) => (
            <View key={milestone.title} style={[styles.listItem, { backgroundColor: theme.surfaceStrong }]}> 
              <View style={styles.listTextWrap}>
                <Text style={[styles.listTitle, { color: theme.text }]}>{milestone.title}</Text>
                <Text style={[styles.listSubtitle, { color: theme.muted }]}>Target: {milestone.requirement}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={[styles.emptyState, { color: theme.muted }]}>More milestones unlock as you grow.</Text>
        )}
        <Text style={[styles.benchmarkNote, { color: theme.muted }]}>Your growth matters most. Optional private comparisons in Settings are not independent proof of skill.</Text>
      </View>
      </> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingTop: 68,
    paddingBottom: 120,
  },
  benchmarkNote: { fontSize: 10, lineHeight: 16, marginTop: 10 },
  heading: {
    fontSize: 34,
    fontWeight: "900",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  summaryCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    marginBottom: 18,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 8,
  },
  summaryText: {
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
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
  },
  smallLabel: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
    marginBottom: 8,
  },
  smallValue: {
    fontSize: 22,
    fontWeight: "900",
  },
  section: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  listTextWrap: {
    flex: 1,
  },
  listTitle: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 2,
  },
  listSubtitle: {
    fontSize: 12,
    lineHeight: 17,
  },
  emptyState: {
    fontSize: 14,
    lineHeight: 20,
  },
  reviewCard: { borderRadius: 20, padding: 18, borderWidth: 1, marginBottom: 18 },
  reviewHeader: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  reviewTitle: { fontSize: 23, fontWeight: "900" },
  reviewProof: { fontSize: 10, fontWeight: "800", textAlign: "right" },
  track: { height: 8, borderRadius: 4, overflow: "hidden", marginTop: 15 },
  trackFill: { height: 8, borderRadius: 4 },
  reviewInsight: { fontSize: 13, lineHeight: 20, marginTop: 13 },
  skillWrap: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 13 },
  skillPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  skillText: { fontSize: 10, fontWeight: "800" },
  rewardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  coinBalance: { fontSize: 14, fontWeight: "900", marginBottom: 12 },
  rewardIntro: { fontSize: 12, marginBottom: 12 },
  rewardCard: { flexDirection: "row", alignItems: "center", borderRadius: 14, padding: 12, marginBottom: 10 },
  rewardBody: { flex: 1, paddingRight: 8 },
  rewardTitle: { fontSize: 14, fontWeight: "900" },
  rewardDescription: { fontSize: 11, lineHeight: 16, marginTop: 3 },
  redeemButton: { minWidth: 68, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 9, alignItems: "center" },
  redeemDisabled: { opacity: 0.45 },
  redeemText: { fontSize: 11, fontWeight: "900" },
  moreButton: { minHeight: 42, borderRadius: 13, borderWidth: 1, alignItems: "center", justifyContent: "center", marginTop: 3 },
  moreButtonText: { fontSize: 11, fontWeight: "900" },
  winsToggle: { minHeight: 72, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderRadius: 18, paddingHorizontal: 17, marginBottom: 18 },
  winsToggleLabel: { fontSize: 10, fontWeight: "900", letterSpacing: 1.1 },
  winsToggleValue: { fontSize: 14, fontWeight: "900", marginTop: 5 },
  winsToggleArrow: { fontSize: 18, fontWeight: "900" },
});
