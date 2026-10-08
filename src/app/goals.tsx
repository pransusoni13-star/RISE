import React, { useState } from "react";
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
type GrowthPath = "career" | "life" | "both";

export default function GoalsScreen() {
  const [growthPath, setGrowthPath] = useState<GrowthPath | null>(null);
  const [careerIds, setCareerIds] = useState<string[]>([]);
  const [lifeIds, setLifeIds] = useState<string[]>([]);
  const [customCareer, setCustomCareer] = useState("");
  const [customLife, setCustomLife] = useState("");
  const [saving, setSaving] = useState(false);
  const labelsFor = (ids: string[], options: readonly GoalOption[], customId: string, customValue: string) => ids.map((id) => id === customId ? customValue.trim() : options.find(([optionId]) => optionId === id)?.[2] || id).filter(Boolean);
  const careerLabels = labelsFor(careerIds, careerGoals, "custom-career", customCareer);
  const lifeLabels = labelsFor(lifeIds, lifeGoals, "custom-life", customLife);
  const validCareer = careerIds.length > 0 && (!careerIds.includes("custom-career") || customCareer.trim().length >= 3);
  const validLife = lifeIds.length > 0 && (!lifeIds.includes("custom-life") || customLife.trim().length >= 3);
  const needsCareer = growthPath === "career" || growthPath === "both";
  const needsLife = growthPath === "life" || growthPath === "both";
  const valid = Boolean(growthPath) && (!needsCareer || validCareer) && (!needsLife || validLife);
  const activeCareerIds = needsCareer ? careerIds : [];
  const activeLifeIds = needsLife ? lifeIds : [];
  const activeCareerLabels = needsCareer ? careerLabels : [];
  const activeLifeLabels = needsLife ? lifeLabels : [];
  const selectedCount = activeCareerIds.length + activeLifeIds.length;
  const combinedGoal = [...activeCareerLabels, ...activeLifeLabels].join(" + ");

  const toggle = (id: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => setter((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);

  const next = async () => {
    if (!valid || saving) return;
    setSaving(true);
    const selectedGoals = [...activeCareerIds, ...activeLifeIds];
    const profile: RiseProfile = { selectedGoals, customGoal: combinedGoal };
    try {
      await saveProfile(profile);
      router.push({ pathname: "/focus", params: { goal: activeCareerIds[0] || activeLifeIds[0], secondaryGoal: activeLifeIds[0], goals: JSON.stringify(selectedGoals), careerGoals: JSON.stringify(activeCareerIds), lifeGoals: JSON.stringify(activeLifeIds), customGoal: combinedGoal } } as any);
    } finally { setSaving(false); }
  };

  return <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === "ios" ? "padding" : undefined}>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={styles.top}><View style={styles.topBrand}><Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable><Text style={styles.logo}>RISE</Text></View><Text style={styles.step}>01 / 03</Text></View>
      <Text style={styles.eyebrow}>YOUR PERSONAL PATH</Text>
      <Text style={styles.title}>What do you want to <Text style={styles.green}>grow first?</Text></Text>
      <Text style={styles.subtitle}>Choose one path now. You can change it later without losing XP or coins.</Text>
      <View style={styles.pathChoices}>
        {([[
          "career", "Career & learning", "Build job, school, or creative skills."
        ], [
          "life", "Life & personal", "Build health, confidence, or wellbeing."
        ], [
          "both", "Both", "Create a balanced plan across both areas."
        ]] as const).map(([value, label, help]) => <Pressable key={value} accessibilityRole="radio" accessibilityState={{ selected: growthPath === value }} onPress={() => setGrowthPath(value)} style={[styles.pathChoice, growthPath === value && styles.pathChoiceActive]}><Text style={[styles.pathChoiceTitle, growthPath === value && styles.pathChoiceTitleActive]}>{label}</Text><Text style={styles.pathChoiceHelp}>{help}</Text></Pressable>)}
      </View>
      {growthPath ? <View style={styles.counter}><Text style={styles.counterText}>{selectedCount} selected · choose at least one in {growthPath === "both" ? "each section" : "your path"}</Text></View> : null}
      {needsCareer ? <><GoalSection number="1" title="CAREER & LEARNING" subtitle="Choose every direction you want to explore or improve." options={careerGoals} selectedIds={careerIds} onToggle={(id) => toggle(id, setCareerIds)} />
      {careerIds.includes("custom-career") ? <GoalInput value={customCareer} onChangeText={setCustomCareer} placeholder="Example: Become an electrician" /> : null}</> : null}
      {needsLife ? <><GoalSection number={growthPath === "both" ? "2" : "1"} title="LIFE & PERSONAL GROWTH" subtitle="Choose everything that would help you feel stronger, healthier, or more grounded." options={lifeGoals} selectedIds={lifeIds} onToggle={(id) => toggle(id, setLifeIds)} />
      {lifeIds.includes("custom-life") ? <GoalInput value={customLife} onChangeText={setCustomLife} placeholder="Example: Improve my sleep routine" /> : null}</> : null}
      {valid ? <View style={styles.balanceCard}><Text style={styles.balanceLabel}>YOUR PATH</Text>{needsCareer ? <><Text style={styles.pathLabel}>CAREER & LEARNING</Text><Text style={styles.balanceText}>{activeCareerLabels.join(" · ")}</Text></> : null}{needsLife ? <><Text style={styles.pathLabel}>LIFE & PERSONAL</Text><Text style={styles.balanceText}>{activeLifeLabels.join(" · ")}</Text></> : null}</View> : null}
    </ScrollView>
    <View style={styles.footer}><Pressable accessibilityRole="button" accessibilityState={{ disabled: !valid || saving }} onPress={next} disabled={!valid || saving} style={[styles.button, (!valid || saving) && styles.disabled]}><Text style={styles.buttonText}>{saving ? "Saving…" : valid ? "Choose My Focus Skills →" : !growthPath ? "Choose a growth path" : needsCareer && !validCareer ? "Choose a career direction" : "Choose a life direction"}</Text></Pressable></View>
  </KeyboardAvoidingView>;
}

function GoalSection({ number, title, subtitle, options, selectedIds, onToggle }: { number: string; title: string; subtitle: string; options: readonly GoalOption[]; selectedIds: string[]; onToggle: (id: string) => void }) {
  return <View style={styles.section}><View style={styles.sectionHeading}><View style={styles.sectionNumber}><Text style={styles.sectionNumberText}>{number}</Text></View><View style={styles.sectionHeadingText}><Text style={styles.label}>{title}</Text><Text style={styles.sectionHelp}>{subtitle}</Text></View></View><View style={styles.grid}>{options.map(([id, emoji, label]) => {
    const active = selectedIds.includes(id);
    return <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: active }} accessibilityLabel={label} key={id} style={[styles.card, active && styles.cardActive]} onPress={() => onToggle(id)}><View style={[styles.circle, active && styles.circleActive]}><Text style={styles.emoji}>{emoji}</Text></View><Text style={[styles.cardText, active && styles.cardTextActive]}>{label}</Text>{active ? <Text style={styles.check}>✓</Text> : null}</Pressable>;
  })}</View></View>;
}

function GoalInput({ value, onChangeText, placeholder }: { value: string; onChangeText: (value: string) => void; placeholder: string }) {
  return <TextInput value={value} onChangeText={onChangeText} maxLength={100} placeholder={placeholder} placeholderTextColor="#668577" style={styles.input} returnKeyType="done" onSubmitEditing={() => Keyboard.dismiss()} />;
}

const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:"#010807"},content:{padding:22,paddingTop:36,paddingBottom:135},top:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginBottom:34},topBrand:{flexDirection:"row",alignItems:"center",gap:11},back:{width:40,height:40,borderRadius:20,borderWidth:1,borderColor:"#29483B",alignItems:"center",justifyContent:"center"},backText:{color:"#7AF5B8",fontSize:28,marginTop:-4},logo:{color:"#7AF5B8",fontSize:22,fontWeight:"900",letterSpacing:6},step:{color:"#7AF5B8",fontSize:12,fontWeight:"900",letterSpacing:2},eyebrow:{color:"#7AF5B8",fontSize:10,fontWeight:"900",letterSpacing:1.5,marginBottom:12},title:{color:"#F5FFF9",fontSize:38,lineHeight:44,fontWeight:"900"},green:{color:"#7AF5B8"},subtitle:{color:"#D7EDE1",fontSize:16,lineHeight:24,fontWeight:"700",marginTop:13,marginBottom:17},pathChoices:{gap:9,marginBottom:18},pathChoice:{borderRadius:17,borderWidth:1,borderColor:"#1E3A31",backgroundColor:"#071B16",padding:15},pathChoiceActive:{borderColor:"#7AF5B8",borderWidth:2,backgroundColor:"#11382B"},pathChoiceTitle:{color:"#F5FFF9",fontSize:15,fontWeight:"900"},pathChoiceTitleActive:{color:"#7AF5B8"},pathChoiceHelp:{color:"#A8C8B7",fontSize:12,lineHeight:18,marginTop:4},counter:{alignSelf:"flex-start",backgroundColor:"#11382B",borderRadius:999,paddingHorizontal:13,paddingVertical:9,marginBottom:27},counterText:{color:"#7AF5B8",fontSize:11,fontWeight:"900"},section:{marginBottom:24},sectionHeading:{flexDirection:"row",alignItems:"flex-start",backgroundColor:"#071B16",borderWidth:1,borderColor:"#1E3A31",borderRadius:18,padding:14,marginBottom:12},sectionNumber:{width:34,height:34,borderRadius:17,backgroundColor:"#7AF5B8",alignItems:"center",justifyContent:"center",marginRight:11},sectionNumberText:{color:"#010807",fontSize:16,fontWeight:"900"},sectionHeadingText:{flex:1},label:{color:"#F5FFF9",fontSize:18,fontWeight:"900",letterSpacing:.3},sectionHelp:{color:"#BBD8C8",fontSize:13,lineHeight:19,fontWeight:"700",marginTop:4},grid:{flexDirection:"row",flexWrap:"wrap",gap:9},card:{width:"47%",flexGrow:1,minHeight:96,borderRadius:18,borderWidth:1,borderColor:"#1E3A31",backgroundColor:"#071B16",padding:10,alignItems:"center",justifyContent:"center",position:"relative"},cardActive:{borderColor:"#7AF5B8",borderWidth:2,backgroundColor:"#11382B"},circle:{width:40,height:40,borderRadius:20,borderWidth:1,borderColor:"#315445",backgroundColor:"#0D2F22",alignItems:"center",justifyContent:"center",marginBottom:7},circleActive:{borderColor:"#7AF5B8",backgroundColor:"#7AF5B8"},emoji:{fontSize:20},cardText:{color:"#F5FFF9",fontSize:12,fontWeight:"900",textAlign:"center"},cardTextActive:{color:"#7AF5B8"},check:{position:"absolute",right:9,top:7,color:"#7AF5B8",fontSize:15,fontWeight:"900"},input:{minHeight:56,borderRadius:16,borderWidth:1,borderColor:"#29483B",backgroundColor:"#071B16",color:"#F5FFF9",padding:15,fontSize:14,fontWeight:"700",marginTop:-12,marginBottom:24},balanceCard:{backgroundColor:"rgba(122,245,184,0.08)",borderWidth:1,borderColor:"rgba(122,245,184,0.25)",borderRadius:17,padding:15},balanceLabel:{color:"#7AF5B8",fontSize:10,fontWeight:"900",letterSpacing:1.2,marginBottom:9},pathLabel:{color:"#8FB6A2",fontSize:9,fontWeight:"900",letterSpacing:1.2,marginTop:7},balanceText:{color:"#F5FFF9",fontSize:14,lineHeight:20,fontWeight:"900",marginTop:3},button:{height:58,borderRadius:29,backgroundColor:"#7AF5B8",alignItems:"center",justifyContent:"center"},disabled:{opacity:.35},footer:{position:"absolute",left:18,right:18,bottom:14,padding:10,borderRadius:28,backgroundColor:"rgba(1,8,7,0.96)"},buttonText:{color:"#010807",fontSize:15,fontWeight:"900"},
});
