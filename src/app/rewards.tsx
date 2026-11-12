import React, { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { useRiseAppearance } from "../services/appearance";
import { createDefaultProgress, RISEProgress } from "../services/progressEngine";
import { progressRepository } from "../services/progressRepository";
import { COIN_REWARDS, CoinReward, loadRedemptions, redeemCoinReward } from "../services/rewards";

export default function RewardsScreen() {
  const { theme } = useRiseAppearance();
  const [progress, setProgress] = useState<RISEProgress>(createDefaultProgress());
  const [redeemed, setRedeemed] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    void Promise.all([progressRepository.load(), loadRedemptions()])
      .then(([nextProgress, nextRedeemed]) => {
        if (!active) return;
        setProgress(nextProgress);
        setRedeemed(nextRedeemed);
      })
      .catch(() => {
        if (active) Alert.alert("Rewards need another try", "Your progress is safe. Reopen Rewards to load it again.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []));

  const nextReward = COIN_REWARDS.find((reward) => !redeemed.includes(reward.id));
  const nextPercent = nextReward ? Math.min(100, Math.round(progress.coins / nextReward.cost * 100)) : 100;

  const redeem = async (reward: CoinReward) => {
    if (redeemingId) return;
    setRedeemingId(reward.id);
    try {
      const result = await redeemCoinReward(reward);
      if (!result.ok) {
        Alert.alert(
          result.reason === "already" ? "Already unlocked" : "Keep earning",
          result.reason === "already" ? "This reward is already yours." : `Complete proof-based missions to earn ${Math.max(0, reward.cost - result.progress.coins)} more coins.`,
        );
        return;
      }
      setProgress(result.progress);
      setRedeemed(result.redeemed);
      Alert.alert("Reward unlocked", reward.description);
    } catch {
      Alert.alert("Couldn’t unlock yet", "Your coins are safe. Check your connection and try again.");
    } finally {
      setRedeemingId(null);
    }
  };

  return <ScrollView style={[styles.page, { backgroundColor: theme.background }]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <Text style={[styles.eyebrow, { color: theme.accent }]}>PROOF EARNS PROGRESS</Text>
    <Text style={[styles.title, { color: theme.text }]}>RISE Rewards</Text>
    <Text style={[styles.subtitle, { color: theme.muted }]}>Celebrate useful work. Rewards mark your progress—they are not purchases or cash prizes.</Text>

    <View style={[styles.balance, { backgroundColor: theme.surfaceStrong, borderColor: theme.blueBorder }]}>
      <Text style={[styles.balanceLabel, { color: theme.muted }]}>YOUR BALANCE</Text>
      <Text style={[styles.balanceValue, { color: theme.accent }]}>{progress.coins} coins</Text>
      <Text style={[styles.balanceHint, { color: theme.muted }]}>Coins have no cash value and cannot be purchased.</Text>
    </View>

    <View style={[styles.nextCard, { backgroundColor: theme.blueSurface, borderColor: theme.blueBorder }]}>
      <Text style={[styles.nextEyebrow, { color: theme.accent }]}>YOUR NEXT SMALL WIN</Text>
      <Text style={[styles.nextTitle, { color: theme.text }]}>{nextReward ? `${nextReward.emoji} ${nextReward.title}` : "All rewards unlocked"}</Text>
      <Text style={[styles.nextText, { color: theme.muted }]}>{nextReward ? `${Math.max(0, nextReward.cost - progress.coins)} more coins. Finish a mission with proof and reflection.` : "Keep building skills for yourself, not just for coins."}</Text>
      <View style={[styles.track, { backgroundColor: theme.border }]}><View style={[styles.trackFill, { backgroundColor: theme.accent, width: `${nextPercent}%` }]} /></View>
    </View>

    {loading ? <View style={[styles.loadingCard, { backgroundColor: theme.surface, borderColor: theme.border }]}><Text style={[styles.loadingText, { color: theme.muted }]}>Loading your rewards…</Text></View> : COIN_REWARDS.map((reward) => {
      const owned = redeemed.includes(reward.id);
      const affordable = progress.coins >= reward.cost;
      const saving = redeemingId === reward.id;
      const disabled = owned || !affordable || redeemingId !== null;
      return <View key={reward.id} style={[styles.card, { backgroundColor: owned ? theme.surfaceStrong : theme.surface, borderColor: owned ? theme.blueBorder : theme.border }]}>
        <View style={[styles.emojiCircle, { backgroundColor: theme.blueSurface }]}><Text style={styles.emoji}>{reward.emoji}</Text></View>
        <View style={styles.body}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>{reward.title}</Text>
          <Text style={[styles.cardText, { color: theme.muted }]}>{reward.description}</Text>
          <Text style={[styles.cost, { color: theme.accent }]}>{owned ? "UNLOCKED" : `${reward.cost} RISE COINS`}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${owned ? "Owned" : affordable ? "Unlock" : "Earn coins for"} ${reward.title}`}
          accessibilityState={{ disabled, busy: saving }}
          onPress={() => void redeem(reward)}
          disabled={disabled}
          style={({ pressed }) => [styles.unlock, { backgroundColor: theme.accent }, disabled && styles.unlockMuted, pressed && styles.pressed]}
        >
          <Text style={[styles.unlockText, { color: theme.accentInk }]}>{saving ? "Unlocking…" : owned ? "Owned" : affordable ? "Unlock" : "Earn coins"}</Text>
        </Pressable>
      </View>;
    })}

    <View style={[styles.rules, { backgroundColor: theme.blueSurface, borderColor: theme.border }]}>
      <Text style={[styles.rulesTitle, { color: theme.accent }]}>Fair reward rules</Text>
      <Text style={[styles.rulesText, { color: theme.text }]}>The same proof cannot earn coins twice. Rewards support progress and rest—not pressure, gambling, or spending money.</Text>
    </View>
  </ScrollView>;
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { width: "100%", maxWidth: 760, alignSelf: "center", padding: 22, paddingTop: 30, paddingBottom: 60 },
  eyebrow: { fontSize: 10, fontWeight: "900", letterSpacing: 1.4 },
  title: { fontSize: 36, fontWeight: "900", marginTop: 9 },
  subtitle: { fontSize: 15, lineHeight: 22, marginTop: 9, marginBottom: 22 },
  balance: { borderRadius: 22, borderWidth: 1, padding: 20, marginBottom: 18 },
  balanceLabel: { fontSize: 9, fontWeight: "900", letterSpacing: 1.3 },
  balanceValue: { fontSize: 31, fontWeight: "900", marginTop: 5 },
  balanceHint: { fontSize: 10, lineHeight: 16, marginTop: 5 },
  nextCard: { borderRadius: 18, borderWidth: 1, padding: 17, marginBottom: 18 },
  nextEyebrow: { fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  nextTitle: { fontSize: 18, fontWeight: "900", marginTop: 7 },
  nextText: { fontSize: 12, lineHeight: 18, marginTop: 6 },
  track: { height: 6, borderRadius: 3, marginTop: 14, overflow: "hidden" },
  trackFill: { height: 6, borderRadius: 3 },
  loadingCard: { minHeight: 100, borderRadius: 18, borderWidth: 1, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  loadingText: { fontSize: 13, fontWeight: "700" },
  card: { flexDirection: "row", alignItems: "center", borderRadius: 18, borderWidth: 1, padding: 15, marginBottom: 10 },
  emojiCircle: { width: 46, height: 46, borderRadius: 15, alignItems: "center", justifyContent: "center", marginRight: 12 },
  emoji: { fontSize: 22 },
  body: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: "900" },
  cardText: { fontSize: 11, lineHeight: 17, marginTop: 4 },
  cost: { fontSize: 9, fontWeight: "900", letterSpacing: 1, marginTop: 8 },
  unlock: { minHeight: 44, minWidth: 78, borderRadius: 22, paddingHorizontal: 12, alignItems: "center", justifyContent: "center", marginLeft: 9 },
  unlockMuted: { opacity: 0.42 },
  unlockText: { fontSize: 10, fontWeight: "900" },
  pressed: { opacity: 0.78 },
  rules: { borderRadius: 17, borderWidth: 1, padding: 16, marginTop: 12 },
  rulesTitle: { fontSize: 13, fontWeight: "900" },
  rulesText: { fontSize: 12, lineHeight: 19, marginTop: 6 },
});
