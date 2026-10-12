import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { markRequiredTourCompleted } from "../services/tourState";

type TourStep = { eyebrow: string; title: string; description: string; previewTitle: string; previewRows: string[] };

const STEPS: TourStep[] = [
  { eyebrow: "1 · TODAY", title: "Start with one mission.", description: "Today shows the single step that matters now.", previewTitle: "TODAY’S MISSION", previewRows: ["Read the outcome", "Check the time", "Tap Start"] },
  { eyebrow: "2 · LEARN", title: "Get context when you need it.", description: "Learn one useful idea, then apply it immediately.", previewTitle: "TODAY’S SKILL", previewRows: ["Open one trusted guide", "Check your understanding", "Return to the mission"] },
  { eyebrow: "3 · FINISH", title: "Complete the real work.", description: "Do every step, write a short reflection, and add proof.", previewTitle: "TO CLAIM THE WIN", previewRows: ["Finish each action", "Write two sentences", "Attach proof"] },
  { eyebrow: "4 · RETURN", title: "Build again tomorrow.", description: "Your work is saved. The next day unlocks on the next calendar day.", previewTitle: "AFTER YOU FINISH", previewRows: ["Progress is saved", "Today shows complete", "Next mission opens tomorrow"] },
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
      <View style={styles.heroRow}><Text style={styles.eyebrow}>{step.eyebrow}</Text></View>
      <Text style={styles.title}>{step.title}</Text><Text style={styles.description}>{step.description}</Text>
      <View style={styles.demo} accessibilityLabel={`Live preview: ${step.previewTitle}`}>
        <View style={styles.demoTop}><View style={styles.liveDot} /><Text style={styles.demoLabel}>LIVE APP PREVIEW</Text></View>
        <Text style={styles.demoTitle}>{step.previewTitle}</Text>
        {step.previewRows.map((row, rowIndex) => <View key={row} style={styles.demoRow}><View style={[styles.demoNumber, rowIndex === step.previewRows.length - 1 && styles.demoNumberAccent]}><Text style={styles.demoNumberText}>{rowIndex + 1}</Text></View><Text style={styles.demoText}>{row}</Text></View>)}
      </View>
    </View>
    <View style={styles.footer}>
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: index === 0 }} disabled={index === 0} onPress={() => setIndex((value) => value - 1)} style={[styles.secondary, index === 0 && styles.disabled]}><Text style={styles.secondaryText}>Back</Text></Pressable>
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: finishing }} disabled={finishing} onPress={() => void finish()} style={({ pressed }) => [styles.primary, (pressed || finishing) && styles.pressed]}><Text style={styles.primaryText}>{last ? (finishing ? "Saving…" : "Enter RISE") : "Continue"}</Text></Pressable>
    </View>
    <Text style={styles.replay}>{required ? "Four quick screens. Then you’re in." : "Replay anytime from Settings."}</Text>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:"#010807",paddingHorizontal:22},header:{height:58,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},close:{width:42,height:42,borderRadius:21,borderWidth:1,borderColor:"#29483B",alignItems:"center",justifyContent:"center"},closeText:{color:"#E8F8EF",fontSize:27,lineHeight:30},requiredBadge:{minHeight:34,borderRadius:17,backgroundColor:"#123C2D",paddingHorizontal:13,alignItems:"center",justifyContent:"center"},requiredText:{color:"#7AF5B8",fontSize:9,fontWeight:"900",letterSpacing:1.05},counter:{color:"#8FB6A2",fontSize:11,fontWeight:"900",letterSpacing:1.2},dots:{flexDirection:"row",gap:7,marginTop:10,marginBottom:18},dot:{flex:1,height:5,borderRadius:4,backgroundColor:"#173126"},dotActive:{backgroundColor:"#7AF5B8"},
  card:{flex:1,backgroundColor:"#0D120F",borderWidth:1,borderColor:"#263129",borderRadius:28,padding:22,justifyContent:"center"},heroRow:{flexDirection:"row",alignItems:"center"},eyebrow:{color:"#56E28A",fontSize:10,fontWeight:"900",letterSpacing:1.4},title:{color:"#F8FBF9",fontSize:30,lineHeight:36,fontWeight:"800",marginTop:20},description:{color:"#A1ADA6",fontSize:14,lineHeight:21,marginTop:10},
  demo:{backgroundColor:"#020E0B",borderWidth:1,borderColor:"#315544",borderRadius:20,padding:16,marginTop:22},demoTop:{flexDirection:"row",alignItems:"center",gap:7},liveDot:{width:7,height:7,borderRadius:4,backgroundColor:"#7AF5B8"},demoLabel:{color:"#82B79B",fontSize:8,fontWeight:"900",letterSpacing:1.2},demoTitle:{color:"#F5FFF9",fontSize:17,fontWeight:"900",marginTop:10,marginBottom:11},demoRow:{flexDirection:"row",alignItems:"center",gap:10,minHeight:38,borderTopWidth:1,borderTopColor:"#173126"},demoNumber:{width:22,height:22,borderRadius:7,backgroundColor:"#123C2D",alignItems:"center",justifyContent:"center"},demoNumberAccent:{backgroundColor:"#7AF5B8"},demoNumberText:{color:"#07110D",fontSize:10,fontWeight:"900"},demoText:{flex:1,color:"#DFFDEE",fontSize:12,fontWeight:"700"},
  footer:{flexDirection:"row",gap:10,marginTop:16},secondary:{height:56,width:105,borderRadius:28,borderWidth:1,borderColor:"#29483B",alignItems:"center",justifyContent:"center"},secondaryText:{color:"#CBE7D7",fontWeight:"900"},primary:{height:56,flex:1,borderRadius:28,backgroundColor:"#7AF5B8",alignItems:"center",justifyContent:"center"},primaryText:{color:"#010807",fontSize:14,fontWeight:"900"},disabled:{opacity:.28},pressed:{opacity:.78},replay:{color:"#668A78",fontSize:10,textAlign:"center",marginTop:11,marginBottom:4},
});
