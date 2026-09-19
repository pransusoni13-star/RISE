import React, { useMemo, useState } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { RiseProfile, saveProfile } from "../services/personalization";

const careerGoals = [
  ["software-engineer", "💻", "Software Engineer"], ["ai-engineer", "🤖", "AI Engineer"],
  ["aerospace-engineer", "🚀", "Aerospace Engineer"], ["entrepreneur", "📈", "Entrepreneur"],
  ["youtube", "🎥", "YouTuber"], ["content-creator", "📱", "Content Creator"],
  ["barbering", "💈", "Barber"], ["graphic-design", "🎨", "Graphic Designer"],
  ["photography", "📷", "Photographer"], ["music", "🎵", "Musician"],
  ["student", "📚", "Student"], ["medicine", "🩺", "Healthcare Career"],
  ["law", "⚖️", "Legal Career"], ["finance", "💰", "Finance"],
  ["marketing", "📣", "Marketing"], ["custom-career", "✨", "My own direction"],
] as const;

const lifeGoals = [
  ["fitness", "💪", "Fitness"], ["athlete", "🏅", "Athletic Performance"],
  ["basketball", "🏀", "Basketball"], ["mobility", "🧘", "Mobility & Recovery"],
  ["nutrition", "🥗", "Nutrition Basics"], ["wellbeing", "🌿", "Wellbeing"],
  ["personal", "🌱", "Personal Growth"], ["spirituality", "🕊️", "Faith & Spirituality"],
  ["custom-life", "✨", "My own life goal"],
] as const;

type GoalOption = readonly [string, string, string];

export default function GoalsScreen() {
  const [careerId, setCareerId] = useState("");
  const [lifeId, setLifeId] = useState("");
  const [customCareer, setCustomCareer] = useState("");
  const [customLife, setCustomLife] = useState("");
  const [saving, setSaving] = useState(false);
  const career = careerGoals.find(([id]) => id === careerId);
  const life = lifeGoals.find(([id]) => id === lifeId);
  const careerLabel = customCareer.trim() || career?.[2] || "";
  const lifeLabel = customLife.trim() || life?.[2] || "";
  const validCareer = !!careerId && (careerId !== "custom-career" || customCareer.trim().length >= 3);
  const validLife = !!lifeId && (lifeId !== "custom-life" || customLife.trim().length >= 3);
  const valid = validCareer && validLife;
  const selectedCount = Number(validCareer) + Number(validLife);
  const combinedGoal = useMemo(() => [careerLabel, lifeLabel].filter(Boolean).join(" + "), [careerLabel, lifeLabel]);

  const next = async () => {
    if (!valid || saving) return;
    setSaving(true);
    const selectedGoals = [careerId, lifeId];
    const profile: RiseProfile = { selectedGoals, customGoal: combinedGoal };
    try {
      await saveProfile(profile);
      router.push({ pathname: "/focus", params: { goal: careerId, secondaryGoal: lifeId, goals: JSON.stringify(selectedGoals), customGoal: combinedGoal } } as any);
    } finally { setSaving(false); }
  };

  return <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === "ios" ? "padding" : undefined}>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={styles.top}><Text style={styles.logo}>RISE</Text><Text style={styles.step}>01 / 03</Text></View>
      <Text style={styles.eyebrow}>YOUR TWO-TRACK PATH</Text>
      <Text style={styles.title}>Build your future <Text style={styles.green}>and</Text> your life.</Text>
      <Text style={styles.subtitle}>Choose one career or learning direction and one wellbeing or personal direction. RISE will connect both without overwhelming you.</Text>
      <View style={styles.counter}><Text style={styles.counterText}>{selectedCount} / 2 directions chosen</Text></View>
      <GoalSection title="1 · CAREER OR LEARNING" subtitle="What do you want to become or get better at?" options={careerGoals} selectedId={careerId} onSelect={setCareerId} />
      {careerId === "custom-career" ? <GoalInput value={customCareer} onChangeText={setCustomCareer} placeholder="Example: Become an electrician" /> : null}
      <GoalSection title="2 · HEALTH, LIFE OR PERSONAL GROWTH" subtitle="What should support the person you are becoming?" options={lifeGoals} selectedId={lifeId} onSelect={setLifeId} />
      {lifeId === "custom-life" ? <GoalInput value={customLife} onChangeText={setCustomLife} placeholder="Example: Improve my sleep routine" /> : null}
      {valid ? <View style={styles.balanceCard}><Text style={styles.balanceLabel}>YOUR CONNECTED PATH</Text><Text style={styles.balanceText}>{careerLabel} + {lifeLabel}</Text></View> : null}
    </ScrollView>
    <View style={styles.footer}><Pressable accessibilityRole="button" accessibilityState={{ disabled: !valid || saving }} onPress={next} disabled={!valid || saving} style={[styles.button, (!valid || saving) && styles.disabled]}><Text style={styles.buttonText}>{saving ? "Saving…" : valid ? "Choose Skills for Both →" : `Choose ${2 - selectedCount} more`}</Text></Pressable></View>
  </KeyboardAvoidingView>;
}

function GoalSection({ title, subtitle, options, selectedId, onSelect }: { title: string; subtitle: string; options: readonly GoalOption[]; selectedId: string; onSelect: (id: string) => void }) {
  return <View style={styles.section}><Text style={styles.label}>{title}</Text><Text style={styles.sectionHelp}>{subtitle}</Text><View style={styles.grid}>{options.map(([id, emoji, label]) => {
    const active = selectedId === id;
    return <Pressable accessibilityRole="radio" accessibilityState={{ selected: active }} accessibilityLabel={label} key={id} style={[styles.card, active && styles.cardActive]} onPress={() => onSelect(id)}><View style={[styles.circle, active && styles.circleActive]}><Text style={styles.emoji}>{emoji}</Text></View><Text style={[styles.cardText, active && styles.cardTextActive]}>{label}</Text></Pressable>;
  })}</View></View>;
}

function GoalInput({ value, onChangeText, placeholder }: { value: string; onChangeText: (value: string) => void; placeholder: string }) {
  return <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#668577" style={styles.input} returnKeyType="done" onSubmitEditing={() => Keyboard.dismiss()} />;
}

const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:"#010807"},content:{padding:22,paddingTop:36,paddingBottom:135},top:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginBottom:34},logo:{color:"#7AF5B8",fontSize:22,fontWeight:"900",letterSpacing:6},step:{color:"#7AF5B8",fontSize:12,fontWeight:"900",letterSpacing:2},eyebrow:{color:"#7AF5B8",fontSize:10,fontWeight:"900",letterSpacing:1.5,marginBottom:12},title:{color:"#F5FFF9",fontSize:38,lineHeight:44,fontWeight:"900"},green:{color:"#7AF5B8"},subtitle:{color:"#BBD8C8",fontSize:15,lineHeight:23,marginTop:13,marginBottom:17},counter:{alignSelf:"flex-start",backgroundColor:"#11382B",borderRadius:999,paddingHorizontal:12,paddingVertical:8,marginBottom:27},counterText:{color:"#7AF5B8",fontSize:11,fontWeight:"900"},section:{marginBottom:20},label:{color:"#7AF5B8",fontSize:10,fontWeight:"900",letterSpacing:1.3},sectionHelp:{color:"#9FC3AF",fontSize:12,lineHeight:18,marginTop:5,marginBottom:12},grid:{flexDirection:"row",flexWrap:"wrap",gap:9},card:{width:"47%",flexGrow:1,minHeight:86,borderRadius:18,borderWidth:1,borderColor:"#1E3A31",backgroundColor:"#071B16",padding:10,alignItems:"center",justifyContent:"center"},cardActive:{borderColor:"#7AF5B8",backgroundColor:"#11382B"},circle:{width:38,height:38,borderRadius:19,borderWidth:1,borderColor:"#315445",backgroundColor:"#0D2F22",alignItems:"center",justifyContent:"center",marginBottom:7},circleActive:{borderColor:"#7AF5B8",backgroundColor:"#7AF5B8"},emoji:{fontSize:19},cardText:{color:"#E8F8EF",fontSize:11,fontWeight:"800",textAlign:"center"},cardTextActive:{color:"#7AF5B8"},input:{minHeight:56,borderRadius:16,borderWidth:1,borderColor:"#29483B",backgroundColor:"#071B16",color:"#F5FFF9",padding:15,fontSize:14,marginTop:-12,marginBottom:24},balanceCard:{backgroundColor:"rgba(122,245,184,0.08)",borderWidth:1,borderColor:"rgba(122,245,184,0.25)",borderRadius:17,padding:15},balanceLabel:{color:"#7AF5B8",fontSize:9,fontWeight:"900",letterSpacing:1.2},balanceText:{color:"#F5FFF9",fontSize:14,fontWeight:"800",marginTop:6},button:{height:58,borderRadius:29,backgroundColor:"#7AF5B8",alignItems:"center",justifyContent:"center"},disabled:{opacity:.35},footer:{position:"absolute",left:18,right:18,bottom:14,padding:10,borderRadius:28,backgroundColor:"rgba(1,8,7,0.96)"},buttonText:{color:"#010807",fontSize:15,fontWeight:"900"},
});
