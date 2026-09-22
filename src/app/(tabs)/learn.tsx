import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { createSevenDayPlan, loadProfile, PersonalizedMission, RiseProfile } from "../../services/personalization";
import { missionRepository } from "../../services/missionRepository";

export default function LearnTabScreen() {
  const [profile, setProfile] = useState<RiseProfile | null>(null);
  const [completedIds, setCompletedIds] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([loadProfile(), missionRepository.list()]).then(([saved, records]) => {
      setProfile(saved);
      setCompletedIds(records.filter((record) => record.status === "completed").map((record) => record.missionId));
    });
  }, []);

  const plan = useMemo(() => profile ? createSevenDayPlan(profile) : [], [profile]);
  const mission = plan.find((item) => !completedIds.includes(item.id)) || plan[plan.length - 1];
  const guides = useMemo(() => mission ? rankedGuides(mission) : [], [mission]);

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
    <Text style={styles.logo}>RISE</Text>
    <Text style={styles.eyebrow}>CURRENT SKILL</Text>
    <Text style={styles.heading}>{profile.weeklySkill}</Text>
    <Text style={styles.subtitle}>Learning here supports your exact next mission for “{profile.customGoal}.”</Text>

    <View style={styles.focusCard}>
      <Text style={styles.focusLabel}>LEARN FOR TODAY’S MISSION</Text>
      <Text style={styles.focusTitle}>{mission.title}</Text>
      <Text style={styles.focusText}>{mission.why}</Text>
    </View>

    <Text style={styles.section}>YOUR LEARNING LOOP</Text>
    <LearningCard number="1" title={`Understand ${profile.weeklySkill}`} text={`Learn only the concept needed for ${mission.title.toLowerCase()}.`} />
    <LearningCard number="2" title="Study a strong example" text="Notice the choices that create the result, not just the final result." />
    <LearningCard number="3" title="Apply it immediately" text="Return to RISE, complete the steps, and prove the result." />

    <Text style={styles.section}>TRUSTED STARTING POINTS</Text>
    {guides.length ? guides.map((guide, index) => <Pressable key={guide.url} accessibilityRole="link" onPress={() => void openLearningResource(guide.url)} style={({ pressed }) => [styles.guideCard, pressed && { opacity: .8 }]}><Text style={styles.guideRank}>#{index + 1}</Text><View style={styles.guideBody}><Text style={styles.guideTitle}>{guide.label}</Text><Text style={styles.guideReason}>{guide.reason}</Text></View><Text style={styles.guideArrow}>↗</Text></Pressable>) : <Text style={styles.sourceCaution}>For this topic, begin with the primary book or qualified teacher you trust. RISE does not rank beliefs or claim an authority for you.</Text>}
    <Pressable accessibilityRole="link" style={({ pressed }) => [styles.resourceButton, pressed && { opacity: .8 }]} onPress={() => void openLearningResource(mission.resourceUrl)}>
      <Text style={styles.resourceButtonText}>Explore full-length videos ↗</Text>
    </Pressable>
    <Text style={styles.sourceCaution}>Video results are a personalized search, not vetted endorsements. Check the creator and claims before relying on a lesson.</Text>
    <Pressable accessibilityRole="button" style={({ pressed }) => [styles.missionButton, pressed && { opacity: .8 }]} onPress={() => router.push({ pathname: "/action", params: { mission: JSON.stringify(mission) } } as any)}>
      <Text style={styles.missionButtonText}>Try this in your mission →</Text>
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

function LearningCard({ number, title, text }: { number: string; title: string; text: string }) {
  return <View style={styles.card}><View style={styles.number}><Text style={styles.numberText}>{number}</Text></View><View style={styles.cardBody}><Text style={styles.cardTitle}>{title}</Text><Text style={styles.cardText}>{text}</Text></View></View>;
}

const styles = StyleSheet.create({
  loading:{flex:1,backgroundColor:"#010807",alignItems:"center",justifyContent:"center"},page:{flex:1,backgroundColor:"#010807"},content:{padding:24,paddingTop:60,paddingBottom:120},logo:{fontSize:18,fontWeight:"900",letterSpacing:5,color:"#7AF5B8",marginBottom:24},
  eyebrow:{color:"#7AF5B8",fontSize:10,fontWeight:"900",letterSpacing:1.4},heading:{fontSize:36,fontWeight:"900",color:"#F5FFF9",marginTop:7},subtitle:{color:"#C8EED9",fontSize:15,lineHeight:22,marginTop:8,marginBottom:22},
  focusCard:{backgroundColor:"rgba(122,245,184,0.08)",borderRadius:19,borderWidth:1,borderColor:"rgba(122,245,184,0.22)",padding:17,marginBottom:25},focusLabel:{color:"#7AF5B8",fontSize:9,fontWeight:"900",letterSpacing:1.2},focusTitle:{color:"#F5FFF9",fontSize:19,fontWeight:"900",marginTop:7},focusText:{color:"#C8EED9",fontSize:13,lineHeight:19,marginTop:6},section:{color:"#8FB6A2",fontSize:10,fontWeight:"900",letterSpacing:1.3,marginBottom:11},
  card:{flexDirection:"row",backgroundColor:"#071B16",borderRadius:17,borderWidth:1,borderColor:"#1E3A31",padding:14,marginBottom:10},number:{width:34,height:34,borderRadius:17,backgroundColor:"#11382B",alignItems:"center",justifyContent:"center",marginRight:12},numberText:{color:"#7AF5B8",fontWeight:"900"},cardBody:{flex:1},cardTitle:{color:"#F5FFF9",fontSize:14,fontWeight:"900"},cardText:{color:"#A7CBB7",fontSize:12,lineHeight:18,marginTop:4},
  resourceButton:{height:54,borderRadius:27,borderWidth:1.5,borderColor:"#7AF5B8",alignItems:"center",justifyContent:"center",marginTop:12},resourceButtonText:{color:"#7AF5B8",fontSize:13,fontWeight:"900"},missionButton:{height:56,borderRadius:28,backgroundColor:"#7AF5B8",alignItems:"center",justifyContent:"center",marginTop:10},missionButtonText:{color:"#010807",fontSize:14,fontWeight:"900"},
  guideCard:{minHeight:70,flexDirection:"row",alignItems:"center",backgroundColor:"#071B16",borderRadius:15,borderWidth:1,borderColor:"#315544",padding:13,marginBottom:9},guideRank:{color:"#7AF5B8",fontSize:13,fontWeight:"900",width:32},guideBody:{flex:1},guideTitle:{color:"#F5FFF9",fontSize:13,fontWeight:"800"},guideReason:{color:"#A7CBB7",fontSize:11,lineHeight:17,marginTop:3},guideArrow:{color:"#7AF5B8",fontSize:17,marginLeft:8},sourceCaution:{color:"#8FB6A2",fontSize:11,lineHeight:17,marginTop:8,marginBottom:10},
});
