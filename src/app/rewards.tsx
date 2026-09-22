import React, { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { createDefaultProgress, RISEProgress } from "../services/progressEngine";
import { progressRepository } from "../services/progressRepository";
import { COIN_REWARDS, CoinReward, loadRedemptions, redeemCoinReward } from "../services/rewards";

export default function RewardsScreen() {
  const [progress, setProgress] = useState<RISEProgress>(createDefaultProgress());
  const [redeemed, setRedeemed] = useState<string[]>([]);
  useFocusEffect(useCallback(() => { void Promise.all([progressRepository.load(), loadRedemptions()]).then(([nextProgress, nextRedeemed]) => { setProgress(nextProgress); setRedeemed(nextRedeemed); }); }, []));
  const nextReward = COIN_REWARDS.find((reward) => !redeemed.includes(reward.id));
  const nextPercent = nextReward ? Math.min(100, Math.round(progress.coins / nextReward.cost * 100)) : 100;

  const redeem = async (reward: CoinReward) => {
    const result = await redeemCoinReward(reward);
    if (!result.ok) {
      Alert.alert(result.reason === "already" ? "Already unlocked" : "Keep earning", result.reason === "already" ? "This reward is already yours." : `Complete proof-based missions to earn ${reward.cost - result.progress.coins} more coins.`);
      return;
    }
    setProgress(result.progress); setRedeemed(result.redeemed);
    Alert.alert("Reward unlocked", reward.description);
  };

  return <ScrollView style={styles.page} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable>
    <Text style={styles.eyebrow}>PROOF EARNS PROGRESS</Text>
    <Text style={styles.title}>RISE Rewards</Text>
    <Text style={styles.subtitle}>Celebrate useful work. Each reward is a small reminder to keep growing—not a purchase or a prize with cash value.</Text>
    <View style={styles.balance}><Text style={styles.balanceLabel}>YOUR BALANCE</Text><Text style={styles.balanceValue}>{progress.coins} 🪙</Text><Text style={styles.balanceHint}>Coins have no cash value and cannot currently be purchased.</Text></View>
    <View style={styles.nextCard}><Text style={styles.nextEyebrow}>YOUR NEXT SMALL WIN</Text><Text style={styles.nextTitle}>{nextReward ? `${nextReward.emoji} ${nextReward.title}` : "✨ All rewards unlocked"}</Text><Text style={styles.nextText}>{nextReward ? `${Math.max(0, nextReward.cost - progress.coins)} more coins to unlock. Finish a mission with proof and reflection to earn coins.` : "Keep building skills for yourself, not just for coins."}</Text><View style={styles.track}><View style={[styles.trackFill, { width: `${nextPercent}%` }]} /></View></View>

    {COIN_REWARDS.map((reward) => {
      const owned = redeemed.includes(reward.id);
      const affordable = progress.coins >= reward.cost;
      return <View key={reward.id} style={[styles.card, owned && styles.cardOwned]}>
        <View style={styles.emojiCircle}><Text style={styles.emoji}>{reward.emoji}</Text></View>
        <View style={styles.body}><Text style={styles.cardTitle}>{reward.title}</Text><Text style={styles.cardText}>{reward.description}</Text><Text style={styles.cost}>{owned ? "UNLOCKED" : `${reward.cost} RISE COINS`}</Text></View>
        <Pressable accessibilityRole="button" accessibilityState={{ disabled: owned || !affordable }} onPress={() => void redeem(reward)} disabled={owned || !affordable} style={({ pressed }) => [styles.unlock, (!affordable || owned) && styles.unlockMuted, pressed && { opacity: .8 }]}><Text style={styles.unlockText}>{owned ? "Owned" : affordable ? "Unlock" : "Earn coins"}</Text></Pressable>
      </View>;
    })}

    <View style={styles.rules}><Text style={styles.rulesTitle}>Fair reward rules</Text><Text style={styles.rulesText}>The same proof cannot earn coins twice. Rewards should support rest, choice, and identity—not pressure, gambling, or spending money.</Text></View>
  </ScrollView>;
}

const styles = StyleSheet.create({
  nextCard:{backgroundColor:"#102A20",borderRadius:18,borderWidth:1,borderColor:"#3B7555",padding:17,marginBottom:18},
  nextEyebrow:{color:"#7AF5B8",fontSize:10,fontWeight:"900",letterSpacing:1},
  nextTitle:{color:"#F5FFF9",fontSize:18,fontWeight:"900",marginTop:7},
  nextText:{color:"#C3DFCF",fontSize:12,lineHeight:18,marginTop:6},
  track:{height:6,borderRadius:3,backgroundColor:"#29493B",marginTop:14,overflow:"hidden"},
  trackFill:{height:6,borderRadius:3,backgroundColor:"#7AF5B8"},
  page:{flex:1,backgroundColor:"#010807"},content:{padding:22,paddingTop:45,paddingBottom:60},back:{width:42,height:42,borderRadius:21,borderWidth:1,borderColor:"#29483B",alignItems:"center",justifyContent:"center",marginBottom:24},backText:{color:"#7AF5B8",fontSize:30,marginTop:-4},eyebrow:{color:"#7AF5B8",fontSize:10,fontWeight:"900",letterSpacing:1.4},title:{color:"#F5FFF9",fontSize:38,fontWeight:"900",marginTop:9},subtitle:{color:"#BBD8C8",fontSize:15,lineHeight:22,marginTop:9,marginBottom:22},balance:{backgroundColor:"#0D2F22",borderRadius:22,borderWidth:1,borderColor:"#295441",padding:20,marginBottom:18},balanceLabel:{color:"#8FB6A2",fontSize:9,fontWeight:"900",letterSpacing:1.3},balanceValue:{color:"#7AF5B8",fontSize:31,fontWeight:"900",marginTop:5},balanceHint:{color:"#9FC3AF",fontSize:10,lineHeight:16,marginTop:5},card:{flexDirection:"row",alignItems:"center",backgroundColor:"#071B16",borderRadius:18,borderWidth:1,borderColor:"#1E3A31",padding:15,marginBottom:10},cardOwned:{borderColor:"#4FA77E",backgroundColor:"#0B281E"},emojiCircle:{width:46,height:46,borderRadius:15,backgroundColor:"#11382B",alignItems:"center",justifyContent:"center",marginRight:12},emoji:{fontSize:22},body:{flex:1},cardTitle:{color:"#F5FFF9",fontSize:14,fontWeight:"900"},cardText:{color:"#9FC3AF",fontSize:11,lineHeight:17,marginTop:4},cost:{color:"#7AF5B8",fontSize:9,fontWeight:"900",letterSpacing:1,marginTop:8},unlock:{minHeight:40,borderRadius:20,backgroundColor:"#7AF5B8",paddingHorizontal:12,alignItems:"center",justifyContent:"center",marginLeft:9},unlockMuted:{opacity:.38},unlockText:{color:"#010807",fontSize:10,fontWeight:"900"},rules:{backgroundColor:"rgba(122,245,184,0.07)",borderRadius:17,padding:16,marginTop:12},rulesTitle:{color:"#7AF5B8",fontSize:13,fontWeight:"900"},rulesText:{color:"#DFFDEE",fontSize:12,lineHeight:19,marginTop:6},
});
