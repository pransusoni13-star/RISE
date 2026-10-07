import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { createSevenDayPlan, loadProfile, PersonalizedMission, RiseProfile } from "../../services/personalization";
import { spiritualResource, spiritualVideoSearch } from "../../services/spiritualResources";
import { AppPageHeader } from "../../components/appPageHeader";
import { getUnlockedDay } from "../../services/dayUnlock";

export default function LearnTabScreen() {
  const [profile, setProfile] = useState<RiseProfile | null>(null);

  useFocusEffect(useCallback(() => {
    let active = true;
    void loadProfile().then((saved) => {
      if (!active) return;
      setProfile(saved);
    });
    return () => { active = false; };
  }, []));

  const plan = useMemo(() => profile ? createSevenDayPlan(profile) : [], [profile]);
  const mission = plan[getUnlockedDay(profile?.skillStartDate, plan.length) - 1] || plan[0];
  const guides = useMemo(() => mission ? rankedGuides(mission) : [], [mission]);
  const isSpiritual = Boolean(mission?.sourceNote);
  const faithSource = isSpiritual ? spiritualResource(profile?.spiritualTradition) : undefined;

  const openLearningResource = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) throw new Error("Unsupported URL");
      await Linking.openURL(url);
    } catch {
      Alert.alert("Could not open resource", "Check your connection and try again.");
    }
  };

  if (!profile || !mission) return <View style={styles.loading}><ActivityIndicator color="#7AF5B8" /></View>;

  return <ScrollView style={styles.page} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <AppPageHeader />
    <Text style={styles.eyebrow}>TODAY&apos;S SKILL</Text>
    <Text style={styles.heading}>{mission.focusSkill} 📖</Text>
    <Text style={styles.subtitle}>Learn one thing. Use it right away.</Text>

    <View style={styles.focusCard}>
      <Text style={styles.focusLabel}>YOUR TARGET</Text>
      <Text style={styles.focusTitle}>{mission.title}</Text>
      <Text style={styles.focusText} numberOfLines={2}>{mission.why}</Text>
    </View>

    <Text style={styles.section}>3 MOVES</Text>
    <View style={styles.moves}>
      <LearningCard emoji="👀" title="Understand" />
      <LearningCard emoji="✨" title="See it" />
      <LearningCard emoji="⚡" title="Use it" />
    </View>

    <Text style={styles.section}>{isSpiritual ? "START WITH YOUR SOURCES" : "TRUSTED STARTING POINTS"}</Text>
    {isSpiritual ? <>
      <View style={styles.faithContext}><Text style={styles.faithTitle}>{faithSource ? `Your ${profile.spiritualTradition} path` : "Your spiritual path"}</Text><Text style={styles.faithText} numberOfLines={2}>{profile.trustedSources?.trim() ? `Start with ${profile.trustedSources.trim()}. ` : "Choose a source meaningful to you. "}{faithSource?.text || "RISE will not choose a belief for you."}</Text></View>
      {faithSource ? <Pressable accessibilityRole="link" onPress={() => void openLearningResource(faithSource.url)} style={({ pressed }) => [styles.guideCard, pressed && { opacity: .8 }]}><Text style={styles.guideRank}>📖</Text><View style={styles.guideBody}><Text style={styles.guideTitle}>{faithSource.label}</Text><Text style={styles.guideReason}>Open reading library</Text></View><Text style={styles.guideArrow}>↗</Text></Pressable> : null}
    </> : guides.length ? guides.map((guide, index) => <Pressable key={guide.url} accessibilityRole="link" onPress={() => void openLearningResource(guide.url)} style={({ pressed }) => [styles.guideCard, pressed && { opacity: .8 }]}><Text style={styles.guideRank}>{index === 0 ? "⭐" : "↗"}</Text><View style={styles.guideBody}><Text style={styles.guideTitle}>{guide.label}</Text><Text style={styles.guideReason} numberOfLines={1}>{guide.reason}</Text></View><Text style={styles.guideArrow}>↗</Text></Pressable>) : <Text style={styles.sourceCaution}>Start with a primary book or qualified teacher you trust.</Text>}
    <Pressable accessibilityRole="link" style={({ pressed }) => [styles.resourceButton, pressed && { opacity: .8 }]} onPress={() => void openLearningResource(isSpiritual ? spiritualVideoSearch(profile.spiritualTradition, mission.title) : mission.resourceUrl)}>
      <Text style={styles.resourceButtonText}>{isSpiritual ? "Find a helpful video ↗" : "Watch & learn ↗"}</Text>
    </Pressable>
    <Text style={styles.sourceCaution}>External results are not RISE endorsements. Check the source.</Text>
    <Pressable accessibilityRole="button" style={({ pressed }) => [styles.missionButton, pressed && { opacity: .8 }]} onPress={() => router.push({ pathname: "/action", params: { mission: JSON.stringify(mission) } } as any)}>
      <Text style={styles.missionButtonText}>I’m ready — start mission →</Text>
    </Pressable>
  </ScrollView>;
}

function rankedGuides(mission: PersonalizedMission) {
  const ranked: { label: string; url: string; reason: string; score: number }[] = [];
  if (mission.guideUrl) ranked.push({ label: mission.guideLabel || "Mission guide", url: mission.guideUrl, reason: "Best topic match from a named teaching or professional source.", score: 100 });
  const context = `${mission.goal} ${mission.skills.join(" ")}`.toLowerCase();
  if (/code|software|developer|react|web/.test(context) && mission.guideUrl !== "https://developer.mozilla.org/en-US/docs/Learn_web_development") ranked.push({ label: "MDN Web Docs", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development", reason: "Structured beginner lessons from the MDN learning community.", score: 80 });
  if (/fitness|strength|athlet|mobility/.test(context) && mission.guideUrl !== "https://www.acefitness.org/resources/everyone/exercise-library/") ranked.push({ label: "ACE Exercise Library", url: "https://www.acefitness.org/resources/everyone/exercise-library/", reason: "Exercise descriptions and form guidance; adapt to your ability.", score: 80 });
  return ranked.sort((a, b) => b.score - a.score).slice(0, 2);
}

function LearningCard({ emoji, title }: { emoji: string; title: string }) {
  return <View style={styles.card}><Text style={styles.moveEmoji}>{emoji}</Text><Text style={styles.cardTitle}>{title}</Text></View>;
}

const styles = StyleSheet.create({
  loading:{flex:1,backgroundColor:"#010807",alignItems:"center",justifyContent:"center"},page:{flex:1,backgroundColor:"#010807"},content:{padding:24,paddingTop:60,paddingBottom:120},logo:{fontSize:18,fontWeight:"900",letterSpacing:5,color:"#7AF5B8",marginBottom:24},
  eyebrow:{color:"#7AF5B8",fontSize:10,fontWeight:"900",letterSpacing:1.4},heading:{fontSize:36,fontWeight:"900",color:"#F5FFF9",marginTop:7},subtitle:{color:"#C8EED9",fontSize:15,lineHeight:22,marginTop:8,marginBottom:22},
  focusCard:{backgroundColor:"rgba(122,245,184,0.08)",borderRadius:21,borderWidth:1,borderColor:"rgba(122,245,184,0.22)",padding:17,marginBottom:21},focusLabel:{color:"#7AF5B8",fontSize:9,fontWeight:"900",letterSpacing:1.2},focusTitle:{color:"#F5FFF9",fontSize:19,fontWeight:"900",marginTop:7},focusText:{color:"#C8EED9",fontSize:13,lineHeight:19,marginTop:6},section:{color:"#8FB6A2",fontSize:10,fontWeight:"900",letterSpacing:1.3,marginBottom:11},
  moves:{flexDirection:"row",gap:9,marginBottom:22},card:{flex:1,backgroundColor:"#071B16",borderRadius:17,borderWidth:1,borderColor:"#1E3A31",paddingVertical:14,paddingHorizontal:8,alignItems:"center"},moveEmoji:{fontSize:20,marginBottom:7},cardTitle:{color:"#F5FFF9",fontSize:12,fontWeight:"900"},
  resourceButton:{height:54,borderRadius:27,borderWidth:1.5,borderColor:"#7AF5B8",alignItems:"center",justifyContent:"center",marginTop:12},resourceButtonText:{color:"#7AF5B8",fontSize:13,fontWeight:"900"},missionButton:{height:56,borderRadius:28,backgroundColor:"#7AF5B8",alignItems:"center",justifyContent:"center",marginTop:10},missionButtonText:{color:"#010807",fontSize:14,fontWeight:"900"},
  guideCard:{minHeight:70,flexDirection:"row",alignItems:"center",backgroundColor:"#071B16",borderRadius:15,borderWidth:1,borderColor:"#315544",padding:13,marginBottom:9},guideRank:{color:"#7AF5B8",fontSize:13,fontWeight:"900",width:32},guideBody:{flex:1},guideTitle:{color:"#F5FFF9",fontSize:13,fontWeight:"800"},guideReason:{color:"#A7CBB7",fontSize:11,lineHeight:17,marginTop:3},guideArrow:{color:"#7AF5B8",fontSize:17,marginLeft:8},sourceCaution:{color:"#8FB6A2",fontSize:11,lineHeight:17,marginTop:8,marginBottom:10},
  faithContext:{backgroundColor:"#172318",borderRadius:15,borderWidth:1,borderColor:"#655338",padding:15,marginBottom:12},faithTitle:{color:"#FFCF70",fontSize:13,fontWeight:"900"},faithText:{color:"#E6DDC8",fontSize:12,lineHeight:19,marginTop:6},
});
