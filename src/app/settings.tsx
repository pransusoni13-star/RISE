import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { loadProfile, RiseProfile } from "../services/personalization";

export default function SettingsScreen() {
  const [profile, setProfile] = useState<RiseProfile | null>(null);
  useEffect(() => { void loadProfile().then(setProfile); }, []);

  return <ScrollView style={styles.page} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable>
    <Text style={styles.eyebrow}>YOUR RISE</Text>
    <Text style={styles.title}>Settings</Text>
    <Text style={styles.subtitle}>Your plan, privacy, and beta access in one place.</Text>

    <View style={styles.statusCard}>
      <View style={styles.statusDot} /><View style={styles.body}><Text style={styles.cardTitle}>Private beta · Free</Text><Text style={styles.cardText}>No subscription is active. Your current data and proof references stay on this device.</Text></View>
    </View>

    <Text style={styles.section}>MY PERSONAL PLAN</Text>
    <View style={styles.planCard}>
      <Text style={styles.planLabel}>DIRECTION</Text><Text style={styles.planValue}>{profile?.customGoal || "Personal growth"}</Text>
      <Text style={styles.planLabel}>THREE-SKILL STACK</Text><Text style={styles.planValue}>{profile?.focusSkills?.join(" · ") || profile?.weeklySkill || "Not chosen"}</Text>
      <Text style={styles.planLabel}>PACE</Text><Text style={styles.planValue}>{profile?.availableTime || "30 minutes"} · {profile?.commitment || "Every 7 days"}</Text>
    </View>
    <Row title="Change direction and skills" text="Rebuild your personal mission cycle" onPress={() => router.push("/goals" as any)} />
    <Row title="Change available time" text="Choose 10, 20, 30, or 60 minutes" onPress={() => router.push({ pathname: "/schedule", params: {
      goals: JSON.stringify(profile?.selectedGoals || ["personal"]),
      customGoal: profile?.customGoal || "Personal growth",
      weeklySkill: profile?.weeklySkill || "Foundations",
      focusSkills: JSON.stringify(profile?.focusSkills || []),
      skillStartDate: profile?.skillStartDate,
      commitment: profile?.commitment,
      experience: profile?.experience,
      spiritualTradition: profile?.spiritualTradition,
      trustedSources: profile?.trustedSources,
      availableTime: profile?.availableTime,
    } } as any)} />

    <Text style={styles.section}>HELP & CONTROL</Text>
    <Row title="RISE Rewards" text="See your coin balance and honest reward rules" onPress={() => router.push("/rewards" as any)} />
    <Row title="Feedback & Improvements" text="Save and share a bug, idea, or confusing moment" onPress={() => router.push("/feedback" as any)} />
    <Row title="Help Center" text="Proof, safety, privacy, and trusted resources" onPress={() => router.push("/help" as any)} />
    <Row title="Privacy, Safety & Terms" text="Permissions, acceptable use, and delete controls" onPress={() => router.push("/legal" as any)} />

    <View style={styles.note}><Text style={styles.noteTitle}>Before paid launch</Text><Text style={styles.noteText}>Accounts, secure cloud sync, purchase restoration, and server-verified subscription access are not active in this beta.</Text></View>
  </ScrollView>;
}

function Row({ title, text, onPress }: { title: string; text: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}><View style={styles.body}><Text style={styles.cardTitle}>{title}</Text><Text style={styles.cardText}>{text}</Text></View><Text style={styles.arrow}>›</Text></Pressable>;
}

const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:"#010807"},content:{padding:22,paddingTop:45,paddingBottom:55},back:{width:42,height:42,borderRadius:21,borderWidth:1,borderColor:"#29483B",alignItems:"center",justifyContent:"center",marginBottom:24},backText:{color:"#7AF5B8",fontSize:30,marginTop:-4},eyebrow:{color:"#7AF5B8",fontSize:10,fontWeight:"900",letterSpacing:1.4},title:{color:"#F5FFF9",fontSize:38,fontWeight:"900",marginTop:8},subtitle:{color:"#BBD8C8",fontSize:15,lineHeight:22,marginTop:8,marginBottom:22},
  statusCard:{flexDirection:"row",backgroundColor:"rgba(122,245,184,0.08)",borderWidth:1,borderColor:"rgba(122,245,184,0.25)",borderRadius:18,padding:16,marginBottom:24},statusDot:{width:10,height:10,borderRadius:5,backgroundColor:"#7AF5B8",marginTop:5,marginRight:11},body:{flex:1},cardTitle:{color:"#F5FFF9",fontSize:14,fontWeight:"900"},cardText:{color:"#9FC3AF",fontSize:12,lineHeight:18,marginTop:4},section:{color:"#8FB6A2",fontSize:10,fontWeight:"900",letterSpacing:1.3,marginTop:8,marginBottom:10},planCard:{backgroundColor:"#071B16",borderRadius:18,borderWidth:1,borderColor:"#1E3A31",padding:16,marginBottom:10},planLabel:{color:"#6F9883",fontSize:9,fontWeight:"900",letterSpacing:1.1,marginTop:9},planValue:{color:"#E8F8EF",fontSize:13,lineHeight:19,fontWeight:"800",marginTop:4},row:{minHeight:70,flexDirection:"row",alignItems:"center",backgroundColor:"#071B16",borderRadius:17,borderWidth:1,borderColor:"#1E3A31",padding:15,marginBottom:9},arrow:{color:"#7AF5B8",fontSize:24,marginLeft:10},note:{backgroundColor:"#0D2F22",borderRadius:17,padding:16,marginTop:17},noteTitle:{color:"#FFCF70",fontSize:13,fontWeight:"900"},noteText:{color:"#DFFDEE",fontSize:12,lineHeight:19,marginTop:6},
});
