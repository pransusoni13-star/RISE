import React, { useMemo, useState } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BuilderHeader } from "../components/builder-ui";
import { useRiseAppearance } from "../services/appearance";
import { getRecommendedSkills, updateProfile } from "../services/personalization";

const cycles = [
  { label: "Every 7 days", note: "Recommended · fresh focus weekly" },
  { label: "Every 10 days", note: "More time to practise" },
  { label: "Every 30 days", note: "Build one skill deeply" },
];
const traditions = ["Christianity", "Islam", "Judaism", "Hinduism", "Buddhism", "Sikhism", "Another tradition", "Still exploring", "Prefer not to say"];

function readList(value: string | string[] | undefined, fallback: string[]): string[] {
  if (typeof value !== "string") return fallback;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String).slice(0, 64) : fallback;
  } catch {
    return fallback;
  }
}

export default function FocusScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useRiseAppearance();
  const params = useLocalSearchParams();
  const goal = typeof params.goal === "string" ? params.goal : "personal";
  const secondaryGoal = typeof params.secondaryGoal === "string" ? params.secondaryGoal : "wellbeing";
  const selectedGoals = useMemo(() => readList(params.goals, [goal]), [params.goals, goal]);
  const careerGoals = useMemo(() => readList(params.careerGoals, []), [params.careerGoals]);
  const lifeGoals = useMemo(() => readList(params.lifeGoals, []), [params.lifeGoals]);
  const customGoal = typeof params.customGoal === "string" ? params.customGoal : "Personal growth";
  const needsCareer = careerGoals.length > 0;
  const needsLife = lifeGoals.length > 0;
  const isSpiritual = selectedGoals.includes("spirituality") || /faith|spiritual|religion|god|prayer/i.test(customGoal);
  const careerSkills = useMemo(() => Array.from(new Set(careerGoals.flatMap(getRecommendedSkills))), [careerGoals]);
  const lifeSkills = useMemo(() => Array.from(new Set(lifeGoals.flatMap(getRecommendedSkills))), [lifeGoals]);
  const skills = useMemo(() => Array.from(new Set([...careerSkills, ...lifeSkills])), [careerSkills, lifeSkills]);

  const [stage, setStage] = useState<"skills" | "rhythm">("skills");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState("");
  const [cycle, setCycle] = useState("");
  const [experience, setExperience] = useState("");
  const [showPersonalization, setShowPersonalization] = useState(false);
  const [spiritualTradition, setSpiritualTradition] = useState("");
  const [trustedSources, setTrustedSources] = useState("");

  const chosenSkills = useMemo(() => [...selectedSkills, ...(customSkill.trim() ? [customSkill.trim()] : [])].slice(0, 3), [selectedSkills, customSkill]);
  const customCoversCareer = Boolean(customSkill.trim()) && needsCareer && !needsLife;
  const customCoversLife = Boolean(customSkill.trim()) && needsLife && !needsCareer;
  const coversCareer = !needsCareer || selectedSkills.some((skill) => careerSkills.includes(skill)) || customCoversCareer;
  const coversLife = !needsLife || selectedSkills.some((skill) => lifeSkills.includes(skill)) || customCoversLife;
  const minimumSkills = needsCareer && needsLife ? 2 : 1;
  const skillsReady = chosenSkills.length >= minimumSkills && coversCareer && coversLife;
  const valid = skillsReady && Boolean(cycle);

  const toggleSkill = (item: string) => {
    setSelectedSkills((current) => {
      if (current.includes(item)) return current.filter((value) => value !== item);
      const limit = customSkill.trim() ? 2 : 3;
      return current.length < limit ? [...current, item] : current;
    });
  };

  const goBack = () => stage === "rhythm" ? setStage("skills") : router.back();

  const continueNext = async () => {
    if (stage === "skills") {
      if (skillsReady) setStage("rhythm");
      return;
    }
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

  const disabled = stage === "skills" ? !skillsReady : !valid;
  const buttonLabel = stage === "skills"
    ? skillsReady
      ? "Set my focus"
      : needsCareer && !coversCareer
        ? "Include a career skill"
        : needsLife && !coversLife
          ? "Include a life skill"
          : `Choose ${Math.max(1, minimumSkills - chosenSkills.length)} more`
    : cycle ? "Choose my daily pace" : "Choose a learning rhythm";

  return (
    <KeyboardAvoidingView style={[styles.page, { backgroundColor: theme.background }]} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 130 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        <BuilderHeader step={2} onBack={goBack} />
        <Text style={[styles.eyebrow, { color: theme.accent }]}>{stage === "skills" ? "PICK YOUR FOCUS" : "CHOOSE YOUR RHYTHM"}</Text>
        <Text style={[styles.title, { color: theme.text }]}>{stage === "skills" ? <>Turn your goals into <Text style={{ color: theme.accent }}>skills.</Text></> : <>Make progress at a pace that <Text style={{ color: theme.accent }}>lasts.</Text></>}</Text>
        <Text style={[styles.subtitle, { color: theme.muted }]}>{stage === "skills" ? `Pick ${minimumSkills === 1 ? "one to three" : "at least two"}. RISE will use these to build your daily missions.` : "Choose how often you want RISE to refresh your main skill."}</Text>

        {stage === "skills" ? (
          <>
            <View style={styles.statusRow}>
              <View style={[styles.count, { backgroundColor: theme.surfaceStrong }]}><Text style={[styles.countText, { color: theme.accent }]}>{chosenSkills.length} / 3</Text></View>
              {needsCareer ? <TrackStatus label="Career" done={coversCareer} /> : null}
              {needsLife ? <TrackStatus label="Life" done={coversLife} /> : null}
            </View>
            <View style={styles.skillList}>{skills.map((item) => {
              const active = selectedSkills.includes(item);
              const track = careerSkills.includes(item) && lifeSkills.includes(item) ? "BOTH" : careerSkills.includes(item) ? "CAREER" : "LIFE";
              return <Pressable key={item} accessibilityRole="checkbox" accessibilityState={{ checked: active, disabled: !active && chosenSkills.length >= 3 }} onPress={() => toggleSkill(item)} style={[styles.skillCard, { backgroundColor: active ? theme.surfaceStrong : theme.surface, borderColor: active ? theme.accent : theme.border }]}>
                <View style={[styles.selection, { borderColor: active ? theme.accent : theme.border, backgroundColor: active ? theme.accent : "transparent" }]}>{active ? <Text style={[styles.selectionText, { color: theme.accentInk }]}>✓</Text> : null}</View>
                <View style={styles.skillCopy}><Text style={[styles.skillName, { color: theme.text }]}>{item}</Text><Text style={[styles.track, { color: theme.muted }]}>{track}</Text></View>
              </Pressable>;
            })}</View>
            <Text style={[styles.fieldLabel, { color: theme.muted }]}>ADD YOUR OWN · OPTIONAL</Text>
            <TextInput value={customSkill} onChangeText={(value) => { setCustomSkill(value); if (value.trim()) setSelectedSkills((current) => current.slice(0, 2)); }} maxLength={80} placeholder="Example: Public speaking" placeholderTextColor={theme.muted} style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]} returnKeyType="done" onSubmitEditing={() => Keyboard.dismiss()} />
          </>
        ) : (
          <>
            <View style={[styles.focusSummary, { backgroundColor: theme.surfaceStrong, borderColor: theme.blueBorder }]}><Text style={[styles.focusSummaryLabel, { color: theme.muted }]}>YOUR FOCUS</Text><Text style={[styles.focusSummaryText, { color: theme.text }]}>{chosenSkills.join(" · ")}</Text></View>
            <View style={styles.cycleList}>{cycles.map((item) => {
              const active = cycle === item.label;
              return <Pressable key={item.label} accessibilityRole="radio" accessibilityState={{ selected: active }} onPress={() => setCycle(item.label)} style={[styles.cycleCard, { backgroundColor: active ? theme.surfaceStrong : theme.surface, borderColor: active ? theme.accent : theme.border }]}><View style={styles.cycleCopy}><Text style={[styles.cycleTitle, { color: theme.text }]}>{item.label}</Text><Text style={[styles.cycleNote, { color: theme.muted }]}>{item.note}</Text></View><Text style={[styles.cycleCheck, { color: active ? theme.accent : theme.border }]}>{active ? "✓" : "○"}</Text></Pressable>;
            })}</View>
            <Pressable accessibilityRole="button" accessibilityState={{ expanded: showPersonalization }} onPress={() => setShowPersonalization((value) => !value)} style={[styles.optionalToggle, { borderColor: theme.border }]}><View><Text style={[styles.optionalTitle, { color: theme.text }]}>Personalize more</Text><Text style={[styles.optionalHelp, { color: theme.muted }]}>Optional experience and trusted sources</Text></View><Text style={[styles.optionalArrow, { color: theme.accent }]}>{showPersonalization ? "−" : "+"}</Text></Pressable>
            {showPersonalization ? <View style={styles.optionalFields}>
              <Text style={[styles.fieldLabel, { color: theme.muted }]}>YOUR EXPERIENCE · OPTIONAL</Text>
              <TextInput value={experience} onChangeText={setExperience} maxLength={160} placeholder="Example: complete beginner" placeholderTextColor={theme.muted} style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]} />
              {isSpiritual ? <><Text style={[styles.fieldLabel, { color: theme.muted }]}>TRADITION · OPTIONAL</Text><View style={styles.traditions}>{traditions.map((item) => <Pressable key={item} onPress={() => setSpiritualTradition(item)} style={[styles.tradition, { borderColor: spiritualTradition === item ? theme.accent : theme.border, backgroundColor: spiritualTradition === item ? theme.surfaceStrong : theme.surface }]}><Text style={[styles.traditionText, { color: theme.text }]}>{item}</Text></Pressable>)}</View><TextInput value={trustedSources} onChangeText={setTrustedSources} maxLength={220} placeholder="Trusted books, teachers, or sources" placeholderTextColor={theme.muted} style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]} /></> : null}
            </View> : null}
          </>
        )}
      </ScrollView>
      <View style={[styles.footer, { backgroundColor: theme.background }]}><Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={continueNext} style={[styles.button, { backgroundColor: theme.accent }, disabled && styles.disabled]}><Text style={[styles.buttonText, { color: theme.accentInk }]}>{buttonLabel}</Text></Pressable></View>
    </KeyboardAvoidingView>
  );
}

function TrackStatus({ label, done }: { label: string; done: boolean }) {
  const { theme } = useRiseAppearance();
  return <View style={[styles.trackStatus, { backgroundColor: done ? theme.accent : theme.surface, borderColor: done ? theme.accent : theme.border }]}><Text style={[styles.trackStatusText, { color: done ? theme.accentInk : theme.muted }]}>{done ? "✓ " : ""}{label}</Text></View>;
}

const styles = StyleSheet.create({
  page: { flex: 1 }, content: { paddingHorizontal: 22 }, eyebrow: { fontSize: 10, fontWeight: "900", letterSpacing: 1.4, marginBottom: 12 },
  title: { fontSize: 38, lineHeight: 43, fontWeight: "900", letterSpacing: -1.2 }, subtitle: { fontSize: 15, lineHeight: 22, fontWeight: "600", marginTop: 12, marginBottom: 22 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 }, count: { minHeight: 34, borderRadius: 17, paddingHorizontal: 12, alignItems: "center", justifyContent: "center" }, countText: { fontSize: 11, fontWeight: "900" }, trackStatus: { minHeight: 34, borderRadius: 17, borderWidth: 1, paddingHorizontal: 11, alignItems: "center", justifyContent: "center" }, trackStatusText: { fontSize: 10, fontWeight: "900" },
  skillList: { gap: 9, marginBottom: 24 }, skillCard: { minHeight: 68, borderRadius: 17, borderWidth: 1, paddingHorizontal: 14, flexDirection: "row", alignItems: "center" }, selection: { width: 28, height: 28, borderRadius: 9, borderWidth: 1.5, alignItems: "center", justifyContent: "center", marginRight: 13 }, selectionText: { fontSize: 14, fontWeight: "900" }, skillCopy: { flex: 1 }, skillName: { fontSize: 15, fontWeight: "900" }, track: { fontSize: 8, fontWeight: "900", letterSpacing: 1.1, marginTop: 4 },
  fieldLabel: { fontSize: 9, fontWeight: "900", letterSpacing: 1.1, marginBottom: 9, marginTop: 5 }, input: { minHeight: 54, borderRadius: 15, borderWidth: 1, paddingHorizontal: 14, fontSize: 14, marginBottom: 18 },
  focusSummary: { borderWidth: 1, borderRadius: 18, padding: 15, marginBottom: 16 }, focusSummaryLabel: { fontSize: 9, fontWeight: "900", letterSpacing: 1.1 }, focusSummaryText: { fontSize: 15, lineHeight: 21, fontWeight: "900", marginTop: 6 },
  cycleList: { gap: 10 }, cycleCard: { minHeight: 76, borderRadius: 18, borderWidth: 1, padding: 15, flexDirection: "row", alignItems: "center" }, cycleCopy: { flex: 1 }, cycleTitle: { fontSize: 16, fontWeight: "900" }, cycleNote: { fontSize: 12, marginTop: 4 }, cycleCheck: { fontSize: 21, fontWeight: "900" },
  optionalToggle: { minHeight: 72, borderTopWidth: 1, borderBottomWidth: 1, marginTop: 24, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, optionalTitle: { fontSize: 14, fontWeight: "900" }, optionalHelp: { fontSize: 11, marginTop: 4 }, optionalArrow: { fontSize: 24, fontWeight: "500" }, optionalFields: { marginTop: 18 }, traditions: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 18 }, tradition: { minHeight: 38, borderRadius: 19, borderWidth: 1, paddingHorizontal: 11, alignItems: "center", justifyContent: "center" }, traditionText: { fontSize: 10, fontWeight: "800" },
  footer: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 22, paddingTop: 12, paddingBottom: 18 }, button: { minHeight: 58, borderRadius: 16, alignItems: "center", justifyContent: "center" }, buttonText: { fontSize: 15, fontWeight: "900" }, disabled: { opacity: 0.38 },
});
