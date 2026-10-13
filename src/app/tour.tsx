import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { markRequiredTourCompleted } from "../services/tourState";
import { useRiseAppearance } from "../services/appearance";

type TourStep = { eyebrow: string; title: string; description: string; previewTitle: string; previewRows: string[] };

const STEPS: TourStep[] = [
  { eyebrow: "1 · TODAY", title: "Start with one mission.", description: "Today shows the single step that matters now.", previewTitle: "TODAY’S MISSION", previewRows: ["Read the outcome", "Check the time", "Tap Start"] },
  { eyebrow: "2 · LEARN", title: "Get context when you need it.", description: "Learn one useful idea, then apply it immediately.", previewTitle: "TODAY’S SKILL", previewRows: ["Open one trusted guide", "Check your understanding", "Return to the mission"] },
  { eyebrow: "3 · FINISH", title: "Complete the real work.", description: "Do every step, write a short reflection, and add proof.", previewTitle: "TO CLAIM THE WIN", previewRows: ["Finish each action", "Write two sentences", "Attach proof"] },
  { eyebrow: "4 · RETURN", title: "Build again tomorrow.", description: "Your work is saved. The next day unlocks on the next calendar day.", previewTitle: "AFTER YOU FINISH", previewRows: ["Progress is saved", "Today shows complete", "Next mission opens tomorrow"] },
];

export default function TourScreen() {
  const params = useLocalSearchParams<{ required?: string }>();
  const { theme } = useRiseAppearance();
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

  return <SafeAreaView style={[styles.page, { backgroundColor: theme.background }]} edges={["top", "bottom"]}>
    <View style={styles.header}>
      {required ? <View style={[styles.requiredBadge, { backgroundColor: theme.surfaceStrong }]}><Text style={[styles.requiredText, { color: theme.accent }]}>QUICK START · REQUIRED ONCE</Text></View> : <Pressable accessibilityRole="button" accessibilityLabel="Close RISE tour" onPress={() => router.back()} style={[styles.close, { borderColor: theme.border }]}><Text style={[styles.closeText, { color: theme.text }]}>×</Text></Pressable>}
      <Text style={[styles.counter, { color: theme.muted }]}>{index + 1} / {STEPS.length}</Text>
    </View>
    <View style={styles.dots}>{STEPS.map((item, dotIndex) => <View key={item.title} style={[styles.dot, { backgroundColor: dotIndex <= index ? theme.accent : theme.border }]} />)}</View>
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
      <View style={styles.heroRow}><Text style={[styles.eyebrow, { color: theme.accent }]}>{step.eyebrow}</Text></View>
      <Text style={[styles.title, { color: theme.text }]}>{step.title}</Text><Text style={[styles.description, { color: theme.muted }]}>{step.description}</Text>
      <View style={[styles.demo, { backgroundColor: theme.background, borderColor: theme.border }]} accessibilityLabel={`Live preview: ${step.previewTitle}`}>
        <View style={styles.demoTop}><View style={[styles.liveDot, { backgroundColor: theme.accent }]} /><Text style={[styles.demoLabel, { color: theme.muted }]}>LIVE APP PREVIEW</Text></View>
        <Text style={[styles.demoTitle, { color: theme.text }]}>{step.previewTitle}</Text>
        {step.previewRows.map((row, rowIndex) => <View key={row} style={[styles.demoRow, { borderTopColor: theme.border }]}><View style={[styles.demoNumber, { backgroundColor: rowIndex === step.previewRows.length - 1 ? theme.accent : theme.surfaceStrong }]}><Text style={[styles.demoNumberText, { color: rowIndex === step.previewRows.length - 1 ? theme.accentInk : theme.text }]}>{rowIndex + 1}</Text></View><Text style={[styles.demoText, { color: theme.text }]}>{row}</Text></View>)}
      </View>
    </View>
    <View style={styles.footer}>
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: index === 0 }} disabled={index === 0} onPress={() => setIndex((value) => value - 1)} style={[styles.secondary, { borderColor: theme.border }, index === 0 && styles.disabled]}><Text style={[styles.secondaryText, { color: theme.text }]}>Back</Text></Pressable>
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: finishing }} disabled={finishing} onPress={() => void finish()} style={({ pressed }) => [styles.primary, { backgroundColor: theme.accent }, (pressed || finishing) && styles.pressed]}><Text style={[styles.primaryText, { color: theme.accentInk }]}>{last ? (finishing ? "Saving…" : "Enter RISE") : "Continue"}</Text></Pressable>
    </View>
    <Text style={[styles.replay, { color: theme.muted }]}>{required ? "Four quick screens. Then you’re in." : "Replay anytime from Settings."}</Text>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  page:{flex:1,paddingHorizontal:22},header:{height:58,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},close:{width:42,height:42,borderRadius:14,borderWidth:1,alignItems:"center",justifyContent:"center"},closeText:{fontSize:27,lineHeight:30},requiredBadge:{minHeight:34,borderRadius:12,paddingHorizontal:13,alignItems:"center",justifyContent:"center"},requiredText:{fontSize:9,fontWeight:"900",letterSpacing:1.05},counter:{fontSize:11,fontWeight:"900",letterSpacing:1.2},dots:{flexDirection:"row",gap:7,marginTop:10,marginBottom:18},dot:{flex:1,height:5,borderRadius:4},
  card:{flex:1,borderWidth:1,borderRadius:20,padding:22,justifyContent:"center"},heroRow:{flexDirection:"row",alignItems:"center"},eyebrow:{fontSize:10,fontWeight:"900",letterSpacing:1.4},title:{fontSize:30,lineHeight:36,fontWeight:"800",marginTop:20},description:{fontSize:14,lineHeight:21,marginTop:10},
  demo:{borderWidth:1,borderRadius:16,padding:16,marginTop:22},demoTop:{flexDirection:"row",alignItems:"center",gap:7},liveDot:{width:7,height:7,borderRadius:4},demoLabel:{fontSize:8,fontWeight:"900",letterSpacing:1.2},demoTitle:{fontSize:17,fontWeight:"900",marginTop:10,marginBottom:11},demoRow:{flexDirection:"row",alignItems:"center",gap:10,minHeight:38,borderTopWidth:1},demoNumber:{width:22,height:22,borderRadius:7,alignItems:"center",justifyContent:"center"},demoNumberText:{fontSize:10,fontWeight:"900"},demoText:{flex:1,fontSize:12,fontWeight:"700"},
  footer:{flexDirection:"row",gap:10,marginTop:16},secondary:{height:54,width:105,borderRadius:14,borderWidth:1,alignItems:"center",justifyContent:"center"},secondaryText:{fontWeight:"900"},primary:{height:54,flex:1,borderRadius:14,alignItems:"center",justifyContent:"center"},primaryText:{fontSize:14,fontWeight:"900"},disabled:{opacity:.28},pressed:{opacity:.78},replay:{fontSize:10,textAlign:"center",marginTop:11,marginBottom:4},
});
