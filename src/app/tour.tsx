import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { markRequiredTourCompleted } from "../services/tourState";

type TourStep = {
  emoji: string;
  eyebrow: string;
  title: string;
  where: string;
  description: string;
  action: string;
  route: string;
};

const STEPS: TourStep[] = [
  {
    emoji: "☀️",
    eyebrow: "START HERE",
    title: "Today shows your next best step.",
    where: "Bottom menu → Today",
    description: "See your current goal, level, daily mission, and reminder status. Tap Start Mission when you are ready to work.",
    action: "Open Today",
    route: "/(tabs)/today",
  },
  {
    emoji: "📖",
    eyebrow: "LEARN FIRST",
    title: "Learn explains the skill simply.",
    where: "Bottom menu → Learn",
    description: "Use the focused lesson and trusted resource before the quiz. RISE keeps the next step connected to your chosen skills.",
    action: "Open Learn",
    route: "/(tabs)/learn",
  },
  {
    emoji: "🎯",
    eyebrow: "TAKE ACTION",
    title: "Missions turn learning into practice.",
    where: "Bottom menu → Missions",
    description: "Follow the small steps, use the linked guide, finish the work, write a short reflection, and attach relevant proof.",
    action: "Open Missions",
    route: "/(tabs)/missions",
  },
  {
    emoji: "🛠️",
    eyebrow: "BUILD SOMETHING",
    title: "Projects connect several skills.",
    where: "Bottom menu → Projects",
    description: "Save a project, break it into manageable work, and use it to create a result you can show—not just a checked box.",
    action: "Open Projects",
    route: "/(tabs)/projects",
  },
  {
    emoji: "📈",
    eyebrow: "SEE YOUR GROWTH",
    title: "Progress shows what is improving.",
    where: "Bottom menu → Progress",
    description: "Review XP, streaks, completed work, skill growth, badges, and your optional private community comparison.",
    action: "Open Progress",
    route: "/(tabs)/progress",
  },
  {
    emoji: "⚙️",
    eyebrow: "MAKE RISE YOURS",
    title: "Settings controls your plan and privacy.",
    where: "Progress → Settings",
    description: "Change your direction, skills, available time, reminders, analytics choice, sign-in, data export, and deletion controls here.",
    action: "Open Settings",
    route: "/settings",
  },
  {
    emoji: "🔔",
    eyebrow: "STAY ACCOUNTABLE",
    title: "Choose one gentle daily reminder.",
    where: "Settings → Daily check-in",
    description: "Pick 8 AM, noon, 6 PM, or 8 PM. Phone permissions and Focus modes can still delay or silence notifications.",
    action: "Set a Reminder",
    route: "/settings",
  },
  {
    emoji: "🏅",
    eyebrow: "CELEBRATE HONEST WORK",
    title: "Rewards recognize consistency.",
    where: "Settings → RISE Rewards",
    description: "See coins and badges earned through completed work. RISE Coins are motivational only and have no cash value.",
    action: "Open Rewards",
    route: "/rewards",
  },
  {
    emoji: "💬",
    eyebrow: "GET HELP",
    title: "Feedback and Help are always available.",
    where: "Settings → Feedback or Help Center",
    description: "Send a private bug report or idea to RISE, solve common permission problems, and find safety and privacy guidance.",
    action: "Open Help Center",
    route: "/help",
  },
  {
    emoji: "🔐",
    eyebrow: "YOUR ACCOUNT & PRIVACY",
    title: "Your controls stay within reach.",
    where: "Progress → Settings → Account and privacy",
    description: "Sign in to sync your plan, export your data, control optional analytics, or delete your account and on-device RISE data. Never share a verification or reset link.",
    action: "Open Settings",
    route: "/settings",
  },
];

export default function TourScreen() {
  const params = useLocalSearchParams<{ required?: string }>();
  const required = params.required === "1";
  const [index, setIndex] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const step = STEPS[index];
  const last = index === STEPS.length - 1;

  return (
    <SafeAreaView style={styles.page} edges={["top", "bottom"]}>
      <View style={styles.header}>
        {required ? <View style={styles.requiredBadge}><Text style={styles.requiredText}>REQUIRED ONCE</Text></View> : <Pressable accessibilityRole="button" accessibilityLabel="Close RISE tour" onPress={() => router.back()} style={styles.close}><Text style={styles.closeText}>×</Text></Pressable>}
        <Text style={styles.counter}>{index + 1} OF {STEPS.length}</Text>
      </View>

      <View style={styles.dots} accessibilityLabel={`Tour step ${index + 1} of ${STEPS.length}`}>
        {STEPS.map((item, dotIndex) => <View key={item.title} style={[styles.dot, dotIndex === index && styles.dotActive]} />)}
      </View>

      <View style={styles.card}>
        <View style={styles.icon}><Text style={styles.emoji}>{step.emoji}</Text></View>
        <Text style={styles.eyebrow}>{step.eyebrow}</Text>
        <Text style={styles.title}>{step.title}</Text>
        <View style={styles.location}><Text style={styles.locationLabel}>WHERE TO FIND IT</Text><Text style={styles.locationText}>{step.where}</Text></View>
        <Text style={styles.description}>{step.description}</Text>
        {required ? <View style={styles.learnFirst}><Text style={styles.learnFirstText}>Finish all {STEPS.length} steps first. Then RISE will open your Today page.</Text></View> : <Pressable accessibilityRole="button" onPress={() => router.push(step.route as never)} style={({ pressed }) => [styles.openButton, pressed && styles.pressed]}><Text style={styles.openButtonText}>{step.action} ↗</Text></Pressable>}
      </View>

      <View style={styles.footer}>
        <Pressable accessibilityRole="button" accessibilityState={{ disabled: index === 0 }} disabled={index === 0} onPress={() => setIndex((value) => value - 1)} style={[styles.secondary, index === 0 && styles.disabled]}>
          <Text style={styles.secondaryText}>← Back</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityState={{ disabled: finishing }} disabled={finishing} onPress={() => {
          if (!last) return setIndex((value) => value + 1);
          if (!required) return router.replace("/(tabs)/today" as never);
          setFinishing(true);
          void markRequiredTourCompleted().then(() => router.replace("/(tabs)/today" as never)).finally(() => setFinishing(false));
        }} style={({ pressed }) => [styles.primary, (pressed || finishing) && styles.pressed]}>
          <Text style={styles.primaryText}>{last ? (finishing ? "Saving..." : "Finish Tour") : "Next"} →</Text>
        </Pressable>
      </View>
      <Text style={styles.replay}>{required ? "This first tour cannot be skipped. You can replay it anytime from Settings or Help." : "You can replay this tour anytime from Settings or Help."}</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:"#010807",paddingHorizontal:22},header:{height:58,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},close:{width:42,height:42,borderRadius:21,borderWidth:1,borderColor:"#29483B",alignItems:"center",justifyContent:"center"},closeText:{color:"#E8F8EF",fontSize:27,lineHeight:30},requiredBadge:{minHeight:34,borderRadius:17,backgroundColor:"#123C2D",paddingHorizontal:13,alignItems:"center",justifyContent:"center"},requiredText:{color:"#7AF5B8",fontSize:9,fontWeight:"900",letterSpacing:1.1},counter:{color:"#8FB6A2",fontSize:10,fontWeight:"900",letterSpacing:1.4},dots:{flexDirection:"row",gap:6,marginTop:12,marginBottom:22},dot:{flex:1,height:4,borderRadius:4,backgroundColor:"#173126"},dotActive:{backgroundColor:"#7AF5B8"},
  card:{flex:1,backgroundColor:"#071B16",borderWidth:1,borderColor:"#1E3A31",borderRadius:28,padding:24,justifyContent:"center"},icon:{width:70,height:70,borderRadius:22,backgroundColor:"#0D2F22",alignItems:"center",justifyContent:"center",marginBottom:24},emoji:{fontSize:33},eyebrow:{color:"#7AF5B8",fontSize:10,fontWeight:"900",letterSpacing:1.5},title:{color:"#F5FFF9",fontSize:32,lineHeight:38,fontWeight:"900",marginTop:10},location:{backgroundColor:"rgba(122,245,184,0.08)",borderWidth:1,borderColor:"rgba(122,245,184,0.22)",borderRadius:16,padding:14,marginTop:20},locationLabel:{color:"#75B995",fontSize:9,fontWeight:"900",letterSpacing:1.2},locationText:{color:"#E8F8EF",fontSize:14,fontWeight:"900",marginTop:5},description:{color:"#BBD8C8",fontSize:15,lineHeight:23,marginTop:19},openButton:{minHeight:50,borderRadius:25,borderWidth:1,borderColor:"#3C6A53",alignItems:"center",justifyContent:"center",marginTop:23},openButtonText:{color:"#9FE7BB",fontSize:13,fontWeight:"900"},
  learnFirst:{minHeight:50,borderRadius:18,borderWidth:1,borderColor:"#3C6A53",backgroundColor:"#0D2F22",paddingHorizontal:15,alignItems:"center",justifyContent:"center",marginTop:23},learnFirstText:{color:"#BDEFD3",fontSize:12,lineHeight:17,textAlign:"center",fontWeight:"800"},footer:{flexDirection:"row",gap:10,marginTop:18},secondary:{height:56,width:105,borderRadius:28,borderWidth:1,borderColor:"#29483B",alignItems:"center",justifyContent:"center"},secondaryText:{color:"#CBE7D7",fontWeight:"900"},primary:{height:56,flex:1,borderRadius:28,backgroundColor:"#7AF5B8",alignItems:"center",justifyContent:"center"},primaryText:{color:"#010807",fontSize:14,fontWeight:"900"},disabled:{opacity:.28},pressed:{opacity:.78},replay:{color:"#668A78",fontSize:10,textAlign:"center",marginTop:12,marginBottom:4},
});
