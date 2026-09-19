import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { createSevenDayPlan, loadProfile, RiseProfile } from "../../services/personalization";
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

  if (!profile || !mission) return <View style={styles.loading}><ActivityIndicator color="#7AF5B8" /></View>;

  return <ScrollView style={styles.page} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <Text style={styles.logo}>RISE</Text>
    <Text style={styles.eyebrow}>CURRENT SKILL</Text>
    <Text style={styles.heading}>{profile.weeklySkill}</Text>
    <Text style={styles.subtitle}>Learning here supports your exact next mission for “{profile.customGoal}.”</Text>

    <View style={styles.focusCard}>
      <Text style={styles.focusLabel}>LEARN FOR TODAY'S MISSION</Text>
      <Text style={styles.focusTitle}>{mission.title}</Text>
      <Text style={styles.focusText}>{mission.why}</Text>
    </View>

    <Text style={styles.section}>YOUR LEARNING LOOP</Text>
    <LearningCard number="1" title={`Understand ${profile.weeklySkill}`} text={`Learn only the concept needed for ${mission.title.toLowerCase()}.`} />
    <LearningCard number="2" title="Study a strong example" text="Notice the choices that create the result, not just the final result." />
    <LearningCard number="3" title="Apply it immediately" text="Return to RISE, complete the steps, and prove the result." />

    <Pressable style={styles.resourceButton} onPress={() => Linking.openURL(mission.resourceUrl)}>
      <Text style={styles.resourceButtonText}>Open Focused Learning Resource ↗</Text>
    </Pressable>
    <Pressable style={styles.missionButton} onPress={() => router.push({ pathname: "/action", params: { mission: JSON.stringify(mission) } } as any)}>
      <Text style={styles.missionButtonText}>Practice in Today’s Mission →</Text>
    </Pressable>
  </ScrollView>;
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
});
