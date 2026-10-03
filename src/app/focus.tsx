import React, { useMemo, useState } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getRecommendedSkills, updateProfile } from "../services/personalization";

const cycles = [
  { label: "Every 7 days", note: "A fresh focus each week" },
  { label: "Every 10 days", note: "More time to practise" },
  { label: "Every 30 days", note: "Build one skill deeply" },
  { label: "Every month", note: "A simple monthly rhythm" },
];
const traditions = ["Christianity", "Islam", "Judaism", "Hinduism", "Buddhism", "Sikhism", "Another tradition", "Still exploring", "Prefer not to say"];

function readList(value: string | string[] | undefined, fallback: string[]): string[] {
  if (typeof value !== "string") return fallback;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) && parsed.length ? parsed.map(String).slice(0, 64) : fallback;
  } catch {
    return fallback;
  }
}

export default function FocusScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const goal = typeof params.goal === "string" ? params.goal : "personal";
  const secondaryGoal = typeof params.secondaryGoal === "string" ? params.secondaryGoal : "wellbeing";
  const selectedGoals = useMemo(() => readList(params.goals, [goal, secondaryGoal]), [params.goals, goal, secondaryGoal]);
  const careerGoals = useMemo(() => readList(params.careerGoals, [goal]), [params.careerGoals, goal]);
  const lifeGoals = useMemo(() => readList(params.lifeGoals, [secondaryGoal]), [params.lifeGoals, secondaryGoal]);
  const customGoal = typeof params.customGoal === "string" ? params.customGoal : "Personal growth";
  const isSpiritual = selectedGoals.includes("spirituality") || /faith|spiritual|religion|god|prayer/i.test(customGoal);
  const primarySkills = useMemo(() => Array.from(new Set(careerGoals.flatMap(getRecommendedSkills))), [careerGoals]);
  const secondarySkills = useMemo(() => Array.from(new Set(lifeGoals.flatMap(getRecommendedSkills))), [lifeGoals]);
  const skills = useMemo(() => Array.from(new Set([...primarySkills, ...secondarySkills])), [primarySkills, secondarySkills]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState("");
  const [cycle, setCycle] = useState("");
  const [experience, setExperience] = useState("");
  const [spiritualTradition, setSpiritualTradition] = useState("");
  const [trustedSources, setTrustedSources] = useState("");
  const chosenSkills = useMemo(
    () => [...selectedSkills, ...(customSkill.trim() ? [customSkill.trim()] : [])].slice(0, 3),
    [selectedSkills, customSkill]
  );
  const coversCareer = selectedSkills.some((skill) => primarySkills.includes(skill));
  const coversLife = selectedSkills.some((skill) => secondarySkills.includes(skill));
  const valid = chosenSkills.length === 3 && coversCareer && coversLife && Boolean(cycle);

  const toggleSkill = (item: string) => {
    setSelectedSkills((current) => {
      if (current.includes(item)) return current.filter((value) => value !== item);
      const limit = customSkill.trim() ? 2 : 3;
      return current.length < limit ? [...current, item] : current;
    });
  };

  const next = async () => {
    if (!valid) return;
    const skillStartDate = new Date().toISOString();
    await updateProfile({
      selectedGoals,
      weeklySkill: chosenSkills[0],
      focusSkills: chosenSkills,
      skillStartDate,
      commitment: cycle,
      experience: experience.trim() || undefined,
      spiritualTradition: isSpiritual ? spiritualTradition || undefined : undefined,
      trustedSources: isSpiritual ? trustedSources.trim() || undefined : undefined,
    });
    router.push({
      pathname: "/schedule",
      params: { goal, secondaryGoal, goals: JSON.stringify(selectedGoals), customGoal, weeklySkill: chosenSkills[0], focusSkills: JSON.stringify(chosenSkills), skillStartDate, commitment: cycle, experience, spiritualTradition, trustedSources },
    } as any);
  };

  return <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === "ios" ? "padding" : undefined}>
    <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 140 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
    <View style={styles.top}><Text style={styles.logo}>RISE</Text><Text style={styles.step}>02 / 03</Text></View>
    <Text style={styles.eyebrow}>YOUR CURRENT FOCUS</Text>
    <Text style={styles.title}>Choose three skills to <Text style={styles.green}>build together.</Text></Text>
    <Text style={styles.subtitle}>Choose exactly three focus skills: at least one for your career and one for your life. Your first choice becomes today’s focus.</Text>

    <View style={styles.counter}><Text style={styles.counterText}>{chosenSkills.length} / 3 selected</Text></View>

    <View style={styles.coverageRow}><Text style={[styles.coverage, coversCareer && styles.coverageDone]}>{coversCareer ? "✓" : "○"} Career skill</Text><Text style={[styles.coverage, coversLife && styles.coverageDone]}>{coversLife ? "✓" : "○"} Life skill</Text></View>
    <Text style={styles.label}>RECOMMENDED ACROSS BOTH DIRECTIONS</Text>
    <View style={styles.grid}>{skills.map((item) => {
      const active = selectedSkills.includes(item);
      return <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: active, disabled: !active && chosenSkills.length >= 3 }} key={item} onPress={() => toggleSkill(item)} style={[styles.card, active && styles.cardActive]}>
        <View style={[styles.radio, active && styles.radioActive]}>{active ? <View style={styles.dot} /> : null}</View>
        <View style={styles.skillBody}><Text style={[styles.cardText, active && styles.cardTextActive]}>{item}</Text><Text style={styles.trackText}>{primarySkills.includes(item) && secondarySkills.includes(item) ? "BOTH TRACKS" : primarySkills.includes(item) ? "CAREER" : "LIFE"}</Text></View>
      </Pressable>;
    })}</View>

    <Text style={styles.label}>OR CREATE YOUR OWN SKILL</Text>
    <TextInput value={customSkill} onChangeText={(value) => { setCustomSkill(value); if (value.trim()) setSelectedSkills((current) => current.slice(0, 2)); }} maxLength={80} placeholder="Optional: make one of the three your own" placeholderTextColor="#668577" style={styles.input} returnKeyType="done" onSubmitEditing={() => Keyboard.dismiss()} />

    <View style={styles.optionalCard}>
      <Text style={styles.optionalTitle}>Personalize even more — optional</Text>
      <Text style={styles.optionalText}>How experienced are you with this skill?</Text>
      <TextInput value={experience} onChangeText={setExperience} maxLength={160} placeholder="Example: beginner, tried it twice, intermediate…" placeholderTextColor="#668577" style={styles.optionalInput} returnKeyType="done" onSubmitEditing={() => Keyboard.dismiss()} />
    </View>

    {isSpiritual ? <View style={styles.faithCard}>
      <Text style={styles.faithEyebrow}>OPTIONAL · YOUR BELIEFS STAY YOURS</Text>
      <Text style={styles.optionalTitle}>Personalize spiritual growth respectfully</Text>
      <Text style={styles.optionalText}>Choose a tradition only if you want. RISE will not guess your religion or say one tradition is better.</Text>
      <View style={styles.traditions}>{traditions.map((item) => <Pressable accessibilityRole="radio" accessibilityState={{ selected: spiritualTradition === item }} key={item} onPress={() => setSpiritualTradition(item)} style={[styles.tradition, spiritualTradition === item && styles.traditionActive]}><Text style={[styles.traditionText, spiritualTradition === item && styles.traditionTextActive]}>{item}</Text></Pressable>)}</View>
      <Text style={styles.sourceLabel}>A DEITY, BOOK, TEACHER, OR COMMUNITY IMPORTANT TO YOU · OPTIONAL</Text>
      <TextInput value={trustedSources} onChangeText={setTrustedSources} maxLength={300} placeholder="Example: a deity, scripture, teacher, or practice I follow" placeholderTextColor="#668577" style={styles.sourceInput} returnKeyType="done" onSubmitEditing={() => Keyboard.dismiss()} />
      <Text style={styles.sourceHelp}>RISE uses this only for guidance inside the app. Your words are not put into YouTube searches; external searches are optional.</Text>
    </View> : null}

    <View style={styles.cycleCard}>
      <Text style={styles.cycleEyebrow}>YOUR LEARNING RHYTHM</Text>
      <Text style={styles.cycleTitle}>When should RISE offer a new skill?</Text>
      <Text style={styles.cycleHelp}>Pick the pace that feels realistic. You can change it later.</Text>
      <View style={styles.cycleRow}>{cycles.map((item) => <Pressable accessibilityRole="radio" accessibilityState={{ selected: cycle === item.label }} accessibilityLabel={`${item.label}. ${item.note}`} key={item.label} onPress={() => setCycle(item.label)} style={[styles.pill, cycle === item.label && styles.pillActive]}>
        <View style={styles.pillCopy}><Text style={[styles.pillText, cycle === item.label && styles.pillTextActive]}>{item.label}</Text><Text style={[styles.pillNote, cycle === item.label && styles.pillNoteActive]}>{item.note}</Text></View><Text style={[styles.pillCheck, cycle === item.label && styles.pillCheckActive]}>{cycle === item.label ? "✓" : "○"}</Text>
      </Pressable>)}</View>
    </View>

    </ScrollView>
    <View style={[styles.footer, { bottom: insets.bottom + 8 }]}><Pressable accessibilityRole="button" accessibilityState={{ disabled: !valid }} onPress={next} disabled={!valid} style={[styles.button, !valid && styles.disabled]}><Text style={styles.buttonText}>{valid ? "Build My Balanced Plan →" : chosenSkills.length < 3 ? `Choose ${3 - chosenSkills.length} more` : !coversCareer || !coversLife ? "Include both directions" : "Choose your learning rhythm"}</Text></Pressable></View>
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:"#010807"},content:{padding:22,paddingTop:36,paddingBottom:135},top:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginBottom:34},
  logo:{color:"#7AF5B8",fontSize:22,fontWeight:"900",letterSpacing:6},step:{color:"#7AF5B8",fontSize:12,fontWeight:"900",letterSpacing:2},eyebrow:{color:"#7AF5B8",fontSize:10,fontWeight:"900",letterSpacing:1.5,marginBottom:12},
  title:{color:"#F5FFF9",fontSize:38,lineHeight:44,fontWeight:"900"},green:{color:"#7AF5B8"},subtitle:{color:"#D7EDE1",fontSize:15,lineHeight:23,fontWeight:"700",marginTop:13,marginBottom:25},
  counter:{alignSelf:"flex-start",backgroundColor:"#11382B",borderRadius:999,paddingHorizontal:12,paddingVertical:8,marginBottom:12},counterText:{color:"#7AF5B8",fontSize:12,fontWeight:"900"},coverageRow:{flexDirection:"row",gap:8,marginBottom:20},coverage:{color:"#8FB6A2",fontSize:10,fontWeight:"900",borderWidth:1,borderColor:"#29483B",borderRadius:999,paddingHorizontal:10,paddingVertical:7},coverageDone:{color:"#010807",backgroundColor:"#7AF5B8",borderColor:"#7AF5B8"},
  label:{color:"#8FB6A2",fontSize:10,fontWeight:"900",letterSpacing:1.2,marginBottom:11},grid:{gap:9,marginBottom:22},card:{minHeight:56,borderRadius:16,borderWidth:1,borderColor:"#1E3A31",backgroundColor:"#071B16",paddingHorizontal:15,flexDirection:"row",alignItems:"center"},cardActive:{borderColor:"#7AF5B8",backgroundColor:"#11382B"},
  radio:{width:24,height:24,borderRadius:12,borderWidth:2,borderColor:"#47695A",alignItems:"center",justifyContent:"center",marginRight:12},radioActive:{borderColor:"#7AF5B8"},dot:{width:10,height:10,borderRadius:5,backgroundColor:"#7AF5B8"},skillBody:{flex:1},cardText:{color:"#E8F8EF",fontSize:14,fontWeight:"800"},cardTextActive:{color:"#7AF5B8"},trackText:{color:"#668577",fontSize:8,fontWeight:"900",letterSpacing:1,marginTop:3},
  input:{height:56,borderRadius:16,borderWidth:1,borderColor:"#29483B",backgroundColor:"#071B16",color:"#F5FFF9",paddingHorizontal:15,fontSize:14,marginBottom:20},optionalCard:{backgroundColor:"rgba(122,245,184,0.07)",borderWidth:1,borderColor:"rgba(122,245,184,0.2)",borderRadius:17,padding:15,marginBottom:22},optionalTitle:{color:"#7AF5B8",fontWeight:"900",fontSize:13},optionalText:{color:"#A7CBB7",fontSize:12,marginTop:5},optionalInput:{height:49,borderRadius:13,borderWidth:1,borderColor:"#29483B",backgroundColor:"#071B16",color:"#F5FFF9",paddingHorizontal:13,fontSize:13,marginTop:11},
  faithCard:{backgroundColor:"rgba(255,207,112,0.06)",borderWidth:1,borderColor:"rgba(255,207,112,0.23)",borderRadius:18,padding:15,marginBottom:22},faithEyebrow:{color:"#FFCF70",fontSize:9,fontWeight:"900",letterSpacing:1.1,marginBottom:8},traditions:{flexDirection:"row",flexWrap:"wrap",gap:7,marginTop:13},tradition:{minHeight:36,borderRadius:18,borderWidth:1,borderColor:"#5B5740",paddingHorizontal:10,alignItems:"center",justifyContent:"center"},traditionActive:{backgroundColor:"#FFCF70",borderColor:"#FFCF70"},traditionText:{color:"#E9DFC3",fontSize:10,fontWeight:"800"},traditionTextActive:{color:"#181205"},sourceLabel:{color:"#B8AC84",fontSize:8,fontWeight:"900",letterSpacing:1,marginTop:15,marginBottom:8},sourceInput:{minHeight:52,borderRadius:13,borderWidth:1,borderColor:"#5B5740",backgroundColor:"#071B16",color:"#F5FFF9",paddingHorizontal:13,fontSize:12},sourceHelp:{color:"#8E876C",fontSize:9,lineHeight:14,marginTop:7},
  cycleCard:{backgroundColor:"#071B16",borderWidth:1,borderColor:"#29483B",borderRadius:20,padding:16,marginBottom:25},cycleEyebrow:{color:"#7AF5B8",fontSize:9,fontWeight:"900",letterSpacing:1.3,marginBottom:7},cycleTitle:{color:"#F5FFF9",fontSize:20,lineHeight:25,fontWeight:"900"},cycleHelp:{color:"#BBD8C8",fontSize:12,lineHeight:18,fontWeight:"700",marginTop:5,marginBottom:13},cycleRow:{gap:8},pill:{minHeight:58,borderRadius:15,borderWidth:1,borderColor:"#29483B",paddingHorizontal:13,paddingVertical:10,flexDirection:"row",alignItems:"center"},pillActive:{backgroundColor:"#11382B",borderColor:"#7AF5B8",borderWidth:2},pillCopy:{flex:1},pillText:{color:"#F5FFF9",fontSize:14,fontWeight:"900"},pillTextActive:{color:"#7AF5B8"},pillNote:{color:"#8FB6A2",fontSize:11,fontWeight:"700",marginTop:2},pillNoteActive:{color:"#D7EDE1"},pillCheck:{color:"#668577",fontSize:19,fontWeight:"900",marginLeft:10},pillCheckActive:{color:"#7AF5B8"},
  button:{height:58,borderRadius:29,backgroundColor:"#7AF5B8",alignItems:"center",justifyContent:"center"},disabled:{opacity:.35},buttonText:{color:"#010807",fontSize:15,fontWeight:"900"},
  footer:{position:"absolute",left:18,right:18,bottom:14,padding:10,borderRadius:28,backgroundColor:"rgba(1,8,7,0.96)"},
});
