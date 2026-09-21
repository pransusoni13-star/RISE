import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { getPopularSkills, PopularSkill, recordProgressEvent } from "../services/auth";
import { updateProfile } from "../services/personalization";

export default function PopularSkillsScreen() {
  const [skills, setSkills] = useState<PopularSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<string | null>(null);

  useEffect(() => { void getPopularSkills().then(setSkills).finally(() => setLoading(false)); }, []);

  const startSkill = async (skill: PopularSkill) => {
    if (starting) return;
    setStarting(skill.slug);
    try {
      const skillStartDate = new Date().toISOString();
      await updateProfile({
        selectedGoals: [skill.default_goal, "wellbeing"],
        customGoal: `Build practical ${skill.name} ability and improve consistently`,
        weeklySkill: skill.name,
        focusSkills: [skill.name, "Focused Practice", "Feedback"],
        skillStartDate,
        commitment: "Every 7 days",
        availableTime: "30 minutes",
      });
      await recordProgressEvent({ clientEventId: `skill:${skill.slug}:${skillStartDate}`, eventType: "skill_selected", skillSlug: skill.slug }).catch(() => undefined);
      router.replace("/plan" as never);
    } catch {
      Alert.alert("Could not start this skill", "Please try again.");
    } finally {
      setStarting(null);
    }
  };

  return <ScrollView style={styles.page} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.topBar}><View style={styles.brandMark}><Text style={styles.brandLetter}>R</Text></View><Text style={styles.logo}>RISE</Text><Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.close}><Text style={styles.closeText}>×</Text></Pressable></View>
    <Text style={styles.eyebrow}>A SIMPLE PLACE TO START</Text>
    <Text style={styles.title}>What would make life feel a little better?</Text>
    <Text style={styles.subtitle}>Pick one. We’ll make a realistic seven-day plan around your time—not someone else’s routine.</Text>
    {loading ? <ActivityIndicator color="#7AF5B8" style={styles.loader} /> : <View style={styles.grid}>{skills.map((skill) => <Pressable accessibilityRole="button" key={skill.slug} disabled={Boolean(starting)} onPress={() => void startSkill(skill)} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.rank}><Text style={styles.rankText}>{skillGlyph(skill.category)}</Text></View>
      <View style={styles.body}><View style={styles.categoryChip}><Text style={styles.category}>{skill.category}</Text></View><Text style={styles.name}>{skill.name}</Text><Text style={styles.description}>{skill.description}</Text></View>
      <View style={styles.arrowCircle}><Text style={styles.arrow}>{starting === skill.slug ? "…" : "→"}</Text></View>
    </Pressable>)}</View>}
    <View style={styles.orRow}><View style={styles.rule} /><Text style={styles.or}>OR</Text><View style={styles.rule} /></View>
    <Pressable accessibilityRole="button" onPress={() => router.replace("/onboarding" as never)} style={styles.customButton}><Text style={styles.customText}>Build a plan around my own goal</Text></Pressable>
    <Text style={styles.note}>Nothing is permanent. You can adjust your goal, pace, and skill mix whenever life changes.</Text>
  </ScrollView>;
}

function skillGlyph(category: string) {
  const glyphs: Record<string, string> = { Career: "↗", Creator: "✦", Trade: "◇", Fitness: "+", Creative: "✺", Personal: "○", Universal: "∞" };
  return glyphs[category] || "·";
}

const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:"#07110D"},content:{width:"100%",maxWidth:680,alignSelf:"center",padding:24,paddingTop:42,paddingBottom:60},topBar:{flexDirection:"row",alignItems:"center",marginBottom:42},brandMark:{width:32,height:32,borderRadius:10,backgroundColor:"#7DE2AD",alignItems:"center",justifyContent:"center"},brandLetter:{color:"#07110D",fontSize:16,fontWeight:"900"},logo:{color:"#F6F8F5",fontSize:16,fontWeight:"800",letterSpacing:3,marginLeft:10},close:{marginLeft:"auto",width:38,height:38,borderRadius:12,borderWidth:1,borderColor:"#29372F",alignItems:"center",justifyContent:"center"},closeText:{color:"#AABAB2",fontSize:24,lineHeight:26,fontWeight:"300"},eyebrow:{color:"#7DE2AD",fontSize:10,fontWeight:"800",letterSpacing:1.5},title:{color:"#F6F8F5",fontSize:36,lineHeight:43,fontWeight:"700",letterSpacing:-.8,marginTop:11,maxWidth:550},subtitle:{color:"#AEBDB5",fontSize:15,lineHeight:23,marginTop:12,marginBottom:27,maxWidth:560},loader:{marginTop:40},grid:{gap:10},card:{minHeight:118,backgroundColor:"#0C1813",borderWidth:1,borderColor:"#213129",borderRadius:16,padding:16,flexDirection:"row",alignItems:"center"},pressed:{opacity:.78,transform:[{scale:.995}]},rank:{width:42,height:42,borderRadius:13,backgroundColor:"#172A21",alignItems:"center",justifyContent:"center",marginRight:14},rankText:{color:"#7DE2AD",fontSize:17,fontWeight:"700"},body:{flex:1},categoryChip:{alignSelf:"flex-start",backgroundColor:"#14231C",borderRadius:5,paddingHorizontal:7,paddingVertical:3},category:{color:"#8CA398",fontSize:9,fontWeight:"700"},name:{color:"#F3F7F4",fontSize:17,fontWeight:"700",marginTop:7},description:{color:"#93A69C",fontSize:12,lineHeight:18,marginTop:4},arrowCircle:{width:34,height:34,borderRadius:17,borderWidth:1,borderColor:"#30483C",alignItems:"center",justifyContent:"center",marginLeft:11},arrow:{color:"#7DE2AD",fontSize:18,marginTop:-1},orRow:{flexDirection:"row",alignItems:"center",gap:10,marginVertical:22},rule:{height:1,backgroundColor:"#26352E",flex:1},or:{color:"#687A71",fontSize:9,fontWeight:"800",letterSpacing:1},customButton:{height:54,borderRadius:12,borderWidth:1,borderColor:"#3A5145",alignItems:"center",justifyContent:"center"},customText:{color:"#CDE2D6",fontSize:13,fontWeight:"700"},note:{color:"#708179",fontSize:10,lineHeight:16,textAlign:"center",marginTop:13,paddingHorizontal:15},
});
