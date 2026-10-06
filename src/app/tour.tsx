import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { markRequiredTourCompleted } from "../services/tourState";

type TourStep = { emoji: string; eyebrow: string; title: string; description: string; previewTitle: string; previewRows: string[] };

const STEPS: TourStep[] = [
  { emoji: "☀️", eyebrow: "1 · TODAY", title: "Start with one clear win.", description: "Today shows the only mission available now, your goal, time, reward, and reminder.", previewTitle: "TODAY’S RISE", previewRows: ["Learn the focused skill", "Complete today’s mission", "Return tomorrow for Day 2"] },
  { emoji: "📖", eyebrow: "2 · LEARN", title: "Learn only what you need.", description: "Open the matched lesson and trusted guide, then apply it immediately instead of collecting random information.", previewTitle: "LEARN → APPLY", previewRows: ["Understand the concept", "Study a strong example", "Use it in your mission"] },
  { emoji: "🎯", eyebrow: "3 · MISSIONS", title: "Do the work—not just a tap.", description: "Define a result, finish every step, write 2–3 sentences, and attach real proof before completion.", previewTitle: "PROOF CHECK", previewRows: ["✓ Clear result", "✓ Every action step", "Required: reflection + proof"] },
  { emoji: "🛠️", eyebrow: "4 · PROJECTS", title: "Turn practice into something visible.", description: "Choose Easy, Medium, Hard, or Insane. Each level increases scope, evidence, and independence.", previewTitle: "PROJECT LEVEL", previewRows: ["Easy · one focused result", "Hard · tested multi-step build", "Insane · launch and measure"] },
  { emoji: "⚙️", eyebrow: "5 · CONTROL", title: "Your plan stays in your hands.", description: "Use Change plan or Settings from every main page. Review progress, reminders, privacy, feedback, export, and account controls.", previewTitle: "ALWAYS AVAILABLE", previewRows: ["Change plan", "Settings & reminders", "Progress & feedback"] },
];

export default function TourScreen() {
  const params = useLocalSearchParams<{ required?: string }>();
  const required = params.required === "1";
  const [index, setIndex] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const step = STEPS[index];
  const last = index === STEPS.length - 1;

  const finish = async () => {
    if (!last) return setIndex((value) => value + 1);
    if (!required) return router.replace("/(tabs)/today" as never);
    setFinishing(true);
    try { await markRequiredTourCompleted(); router.replace("/(tabs)/today" as never); }
    finally { setFinishing(false); }
  };

  return <SafeAreaView style={styles.page} edges={["top", "bottom"]}>
    <View style={styles.header}>
      {required ? <View style={styles.requiredBadge}><Text style={styles.requiredText}>QUICK START · REQUIRED ONCE</Text></View> : <Pressable accessibilityRole="button" accessibilityLabel="Close RISE tour" onPress={() => router.back()} style={styles.close}><Text style={styles.closeText}>×</Text></Pressable>}
      <Text style={styles.counter}>{index + 1} / {STEPS.length}</Text>
    </View>
    <View style={styles.dots}>{STEPS.map((item, dotIndex) => <View key={item.title} style={[styles.dot, dotIndex <= index && styles.dotActive]} />)}</View>
    <View style={styles.card}>
      <View style={styles.heroRow}><View style={styles.icon}><Text style={styles.emoji}>{step.emoji}</Text></View><Text style={styles.eyebrow}>{step.eyebrow}</Text></View>
      <Text style={styles.title}>{step.title}</Text><Text style={styles.description}>{step.description}</Text>
      <View style={styles.demo} accessibilityLabel={`Live preview: ${step.previewTitle}`}>
        <View style={styles.demoTop}><View style={styles.liveDot} /><Text style={styles.demoLabel}>LIVE APP PREVIEW</Text></View>
        <Text style={styles.demoTitle}>{step.previewTitle}</Text>
        {step.previewRows.map((row, rowIndex) => <View key={row} style={styles.demoRow}><View style={[styles.demoNumber, rowIndex === step.previewRows.length - 1 && styles.demoNumberAccent]}><Text style={styles.demoNumberText}>{rowIndex + 1}</Text></View><Text style={styles.demoText}>{row}</Text></View>)}
      </View>
    </View>
    <View style={styles.footer}>
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: index === 0 }} disabled={index === 0} onPress={() => setIndex((value) => value - 1)} style={[styles.secondary, index === 0 && styles.disabled]}><Text style={styles.secondaryText}>← Back</Text></Pressable>
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: finishing }} disabled={finishing} onPress={() => void finish()} style={({ pressed }) => [styles.primary, (pressed || finishing) && styles.pressed]}><Text style={styles.primaryText}>{last ? (finishing ? "Saving…" : "Enter RISE") : "Show me next"} →</Text></Pressable>
    </View>
    <Text style={styles.replay}>{required ? "Five quick previews, then your personal plan opens." : "Replay this quick guide anytime from Settings."}</Text>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:"#010807",paddingHorizontal:22},header:{height:58,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},close:{width:42,height:42,borderRadius:21,borderWidth:1,borderColor:"#29483B",alignItems:"center",justifyContent:"center"},closeText:{color:"#E8F8EF",fontSize:27,lineHeight:30},requiredBadge:{minHeight:34,borderRadius:17,backgroundColor:"#123C2D",paddingHorizontal:13,alignItems:"center",justifyContent:"center"},requiredText:{color:"#7AF5B8",fontSize:9,fontWeight:"900",letterSpacing:1.05},counter:{color:"#8FB6A2",fontSize:11,fontWeight:"900",letterSpacing:1.2},dots:{flexDirection:"row",gap:7,marginTop:10,marginBottom:18},dot:{flex:1,height:5,borderRadius:4,backgroundColor:"#173126"},dotActive:{backgroundColor:"#7AF5B8"},
  card:{flex:1,backgroundColor:"#071B16",borderWidth:1,borderColor:"#1E3A31",borderRadius:28,padding:22,justifyContent:"center"},heroRow:{flexDirection:"row",alignItems:"center",gap:13},icon:{width:52,height:52,borderRadius:17,backgroundColor:"#0D2F22",alignItems:"center",justifyContent:"center"},emoji:{fontSize:25},eyebrow:{color:"#7AF5B8",fontSize:10,fontWeight:"900",letterSpacing:1.4},title:{color:"#F5FFF9",fontSize:30,lineHeight:36,fontWeight:"900",marginTop:20},description:{color:"#BBD8C8",fontSize:14,lineHeight:21,marginTop:10},
  demo:{backgroundColor:"#020E0B",borderWidth:1,borderColor:"#315544",borderRadius:20,padding:16,marginTop:22},demoTop:{flexDirection:"row",alignItems:"center",gap:7},liveDot:{width:7,height:7,borderRadius:4,backgroundColor:"#7AF5B8"},demoLabel:{color:"#82B79B",fontSize:8,fontWeight:"900",letterSpacing:1.2},demoTitle:{color:"#F5FFF9",fontSize:17,fontWeight:"900",marginTop:10,marginBottom:11},demoRow:{flexDirection:"row",alignItems:"center",gap:10,minHeight:38,borderTopWidth:1,borderTopColor:"#173126"},demoNumber:{width:22,height:22,borderRadius:7,backgroundColor:"#123C2D",alignItems:"center",justifyContent:"center"},demoNumberAccent:{backgroundColor:"#7AF5B8"},demoNumberText:{color:"#07110D",fontSize:10,fontWeight:"900"},demoText:{flex:1,color:"#DFFDEE",fontSize:12,fontWeight:"700"},
  footer:{flexDirection:"row",gap:10,marginTop:16},secondary:{height:56,width:105,borderRadius:28,borderWidth:1,borderColor:"#29483B",alignItems:"center",justifyContent:"center"},secondaryText:{color:"#CBE7D7",fontWeight:"900"},primary:{height:56,flex:1,borderRadius:28,backgroundColor:"#7AF5B8",alignItems:"center",justifyContent:"center"},primaryText:{color:"#010807",fontSize:14,fontWeight:"900"},disabled:{opacity:.28},pressed:{opacity:.78},replay:{color:"#668A78",fontSize:10,textAlign:"center",marginTop:11,marginBottom:4},
});
