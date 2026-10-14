import React, { useMemo, useState } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BuilderHeader } from "../components/builder-ui";
import { useRiseAppearance } from "../services/appearance";
import { RiseProfile, saveProfile } from "../services/personalization";

const careerGoals = [
  ["software-engineer", "SE", "Software Engineer"], ["ai-engineer", "AI", "AI Engineer"],
  ["aerospace-engineer", "AE", "Aerospace Engineer"], ["entrepreneur", "EN", "Entrepreneur"],
  ["youtube", "YT", "YouTuber"], ["content-creator", "CC", "Content Creator"],
  ["barbering", "BR", "Barber"], ["graphic-design", "GD", "Graphic Designer"],
  ["photography", "PH", "Photographer"], ["music", "MU", "Musician"],
  ["student", "ST", "Student"], ["medicine", "HC", "Healthcare Career"],
  ["law", "LW", "Legal Career"], ["finance", "FI", "Finance"],
  ["marketing", "MK", "Marketing"], ["custom-career", "+", "My own direction"],
] as const;

const lifeGoals = [
  ["fitness", "FT", "Fitness"], ["athlete", "AP", "Athletic Performance"],
  ["basketball", "BB", "Basketball"], ["mobility", "MR", "Mobility & Recovery"],
  ["nutrition", "NU", "Nutrition Basics"], ["wellbeing", "WB", "Wellbeing"],
  ["personal", "PG", "Personal Growth"], ["spirituality", "FS", "Faith & Spirituality"],
  ["custom-life", "+", "My own life goal"],
] as const;

type GoalOption = readonly [string, string, string];
type GrowthPath = "career" | "life" | "both";
type Direction = "career" | "life";

export default function GoalsScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useRiseAppearance();
  const [growthPath, setGrowthPath] = useState<GrowthPath | null>(null);
  const [activeDirection, setActiveDirection] = useState<Direction>("career");
  const [careerIds, setCareerIds] = useState<string[]>([]);
  const [lifeIds, setLifeIds] = useState<string[]>([]);
  const [customCareer, setCustomCareer] = useState("");
  const [customLife, setCustomLife] = useState("");
  const [saving, setSaving] = useState(false);

  const needsCareer = growthPath === "career" || growthPath === "both";
  const needsLife = growthPath === "life" || growthPath === "both";
  const validCareer = careerIds.length > 0 && (!careerIds.includes("custom-career") || customCareer.trim().length >= 3);
  const validLife = lifeIds.length > 0 && (!lifeIds.includes("custom-life") || customLife.trim().length >= 3);
  const valid = Boolean(growthPath) && (!needsCareer || validCareer) && (!needsLife || validLife);
  const labelsFor = (ids: string[], options: readonly GoalOption[], customId: string, customValue: string) => ids
    .map((id) => id === customId ? customValue.trim() : options.find(([optionId]) => optionId === id)?.[2] || id)
    .filter(Boolean);
  const careerLabels = useMemo(() => labelsFor(careerIds, careerGoals, "custom-career", customCareer), [careerIds, customCareer]);
  const lifeLabels = useMemo(() => labelsFor(lifeIds, lifeGoals, "custom-life", customLife), [lifeIds, customLife]);
  const shownDirection: Direction = growthPath === "life" ? "life" : activeDirection;
  const shownOptions = shownDirection === "career" ? careerGoals : lifeGoals;
  const shownIds = shownDirection === "career" ? careerIds : lifeIds;
  const shownValid = shownDirection === "career" ? validCareer : validLife;

  const choosePath = (path: GrowthPath) => {
    setGrowthPath(path);
    setActiveDirection(path === "life" ? "life" : "career");
  };

  const toggle = (id: string) => {
    const setter = shownDirection === "career" ? setCareerIds : setLifeIds;
    setter((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  };

  const continueNext = async () => {
    if (!growthPath || saving) return;
    if (growthPath === "both" && activeDirection === "career") {
      if (validCareer) setActiveDirection("life");
      return;
    }
    if (!valid) return;
    setSaving(true);
    const activeCareerIds = needsCareer ? careerIds : [];
    const activeLifeIds = needsLife ? lifeIds : [];
    const selectedGoals = [...activeCareerIds, ...activeLifeIds];
    const combinedGoal = [...(needsCareer ? careerLabels : []), ...(needsLife ? lifeLabels : [])].join(" + ");
    const profile: RiseProfile = { selectedGoals, customGoal: combinedGoal };
    try {
      await saveProfile(profile);
      router.push({
        pathname: "/focus",
        params: {
          goal: activeCareerIds[0] || activeLifeIds[0],
          secondaryGoal: activeLifeIds[0] || activeCareerIds[0],
          goals: JSON.stringify(selectedGoals),
          careerGoals: JSON.stringify(activeCareerIds),
          lifeGoals: JSON.stringify(activeLifeIds),
          customGoal: combinedGoal,
        },
      } as any);
    } finally {
      setSaving(false);
    }
  };

  const ctaDisabled = !growthPath || !shownValid || saving;
  const ctaLabel = saving ? "Saving…" : !growthPath ? "Choose a path" : !shownValid
    ? `Choose a ${shownDirection} goal`
    : growthPath === "both" && activeDirection === "career" ? "Next: life growth" : "Choose my focus";

  return (
    <KeyboardAvoidingView style={[styles.page, { backgroundColor: theme.background }]} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 130 }]} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>
        <BuilderHeader step={1} onBack={() => router.back()} />
        <Text style={[styles.eyebrow, { color: theme.accent }]}>BUILD YOUR PLAN</Text>
        <Text style={[styles.title, { color: theme.text }]}>What do you want to improve <Text style={{ color: theme.accent }}>first?</Text></Text>
        <Text style={[styles.subtitle, { color: theme.muted }]}>Pick a lane. RISE will turn it into small daily actions.</Text>

        {!growthPath ? (
          <View style={styles.pathChoices}>
            <PathChoice title="Career growth" detail="Work, school, or creative skills" value="career" onPress={choosePath} />
            <PathChoice title="Life growth" detail="Health, confidence, or wellbeing" value="life" onPress={choosePath} />
            <PathChoice title="A balanced plan" detail="One path across career and life" value="both" onPress={choosePath} />
          </View>
        ) : (
          <>
            <View style={[styles.summary, { backgroundColor: theme.surfaceStrong, borderColor: theme.blueBorder }]}>
              <View style={styles.summaryCopy}><Text style={[styles.summaryLabel, { color: theme.muted }]}>YOUR LANE</Text><Text style={[styles.summaryTitle, { color: theme.text }]}>{growthPath === "career" ? "Career growth" : growthPath === "life" ? "Life growth" : "Balanced growth"}</Text></View>
              <Pressable accessibilityRole="button" onPress={() => setGrowthPath(null)}><Text style={[styles.change, { color: theme.accent }]}>Change</Text></Pressable>
            </View>
            {growthPath === "both" ? <View style={[styles.tabs, { backgroundColor: theme.surface, borderColor: theme.border }]}><DirectionTab label="Career" active={activeDirection === "career"} complete={validCareer} onPress={() => setActiveDirection("career")} /><DirectionTab label="Life" active={activeDirection === "life"} complete={validLife} onPress={() => setActiveDirection("life")} /></View> : null}
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{shownDirection === "career" ? "Choose your direction" : "Choose your life goal"}</Text>
            <Text style={[styles.sectionHelp, { color: theme.muted }]}>Choose as many as you want. Your next step will narrow the focus.</Text>
            <View style={styles.grid}>{shownOptions.map(([id, mark, label]) => {
              const active = shownIds.includes(id);
              return <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: active }} accessibilityLabel={label} key={id} onPress={() => toggle(id)} style={[styles.goalCard, { backgroundColor: active ? theme.surfaceStrong : theme.surface, borderColor: active ? theme.accent : theme.border }]}>
                <View style={[styles.mark, { backgroundColor: active ? theme.accent : theme.blueSurface, borderColor: active ? theme.accent : theme.blueBorder }]}><Text style={[styles.markText, { color: active ? theme.accentInk : theme.text }]}>{mark}</Text></View>
                <Text style={[styles.goalText, { color: theme.text }]}>{label}</Text>{active ? <Text style={[styles.check, { color: theme.accent }]}>✓</Text> : null}
              </Pressable>;
            })}</View>
            {shownDirection === "career" && careerIds.includes("custom-career") ? <GoalInput value={customCareer} onChangeText={setCustomCareer} placeholder="Example: Become an electrician" /> : null}
            {shownDirection === "life" && lifeIds.includes("custom-life") ? <GoalInput value={customLife} onChangeText={setCustomLife} placeholder="Example: Build a better sleep routine" /> : null}
            <View style={[styles.selectedStrip, { borderColor: theme.border }]}><Text style={[styles.selectedCount, { color: theme.accent }]}>{shownIds.length}</Text><Text style={[styles.selectedText, { color: theme.muted }]}>{shownDirection} goal{shownIds.length === 1 ? "" : "s"} selected</Text></View>
          </>
        )}
      </ScrollView>
      <View style={[styles.footer, { backgroundColor: theme.background }]}><Pressable accessibilityRole="button" accessibilityState={{ disabled: ctaDisabled }} disabled={ctaDisabled} onPress={continueNext} style={[styles.button, { backgroundColor: theme.accent }, ctaDisabled && styles.disabled]}><Text style={[styles.buttonText, { color: theme.accentInk }]}>{ctaLabel}</Text></Pressable></View>
    </KeyboardAvoidingView>
  );
}

function PathChoice({ title, detail, value, onPress }: { title: string; detail: string; value: GrowthPath; onPress: (value: GrowthPath) => void }) {
  const { theme } = useRiseAppearance();
  return <Pressable accessibilityRole="button" onPress={() => onPress(value)} style={[styles.pathChoice, { backgroundColor: theme.surface, borderColor: theme.border }]}><View style={[styles.pathNumber, { backgroundColor: theme.surfaceStrong }]}><Text style={[styles.pathNumberText, { color: theme.accent }]}>{value === "career" ? "01" : value === "life" ? "02" : "03"}</Text></View><View style={styles.pathCopy}><Text style={[styles.pathTitle, { color: theme.text }]}>{title}</Text><Text style={[styles.pathDetail, { color: theme.muted }]}>{detail}</Text></View><Text style={[styles.pathArrow, { color: theme.accent }]}>→</Text></Pressable>;
}

function DirectionTab({ label, active, complete, onPress }: { label: string; active: boolean; complete: boolean; onPress: () => void }) {
  const { theme } = useRiseAppearance();
  return <Pressable accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={onPress} style={[styles.tab, active && { backgroundColor: theme.surfaceStrong }]}><Text style={[styles.tabText, { color: active ? theme.text : theme.muted }]}>{complete ? "✓ " : ""}{label}</Text></Pressable>;
}

function GoalInput({ value, onChangeText, placeholder }: { value: string; onChangeText: (value: string) => void; placeholder: string }) {
  const { theme } = useRiseAppearance();
  return <TextInput value={value} onChangeText={onChangeText} maxLength={100} placeholder={placeholder} placeholderTextColor={theme.muted} style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]} returnKeyType="done" onSubmitEditing={() => Keyboard.dismiss()} />;
}

const styles = StyleSheet.create({
  page: { flex: 1 }, content: { paddingHorizontal: 22 }, eyebrow: { fontSize: 10, fontWeight: "900", letterSpacing: 1.4, marginBottom: 12 },
  title: { fontSize: 38, lineHeight: 43, fontWeight: "900", letterSpacing: -1.2 }, subtitle: { fontSize: 15, lineHeight: 22, fontWeight: "600", marginTop: 12, marginBottom: 24 },
  pathChoices: { gap: 11 }, pathChoice: { minHeight: 92, borderWidth: 1, borderRadius: 20, padding: 15, flexDirection: "row", alignItems: "center" }, pathNumber: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center" }, pathNumberText: { fontSize: 11, fontWeight: "900", letterSpacing: 1 },
  pathCopy: { flex: 1, marginLeft: 13 }, pathTitle: { fontSize: 17, fontWeight: "900" }, pathDetail: { fontSize: 12, lineHeight: 17, marginTop: 4 }, pathArrow: { fontSize: 22, fontWeight: "700", marginLeft: 8 },
  summary: { borderWidth: 1, borderRadius: 18, padding: 14, flexDirection: "row", alignItems: "center", marginBottom: 16 }, summaryCopy: { flex: 1 }, summaryLabel: { fontSize: 9, fontWeight: "900", letterSpacing: 1.1 }, summaryTitle: { fontSize: 16, fontWeight: "900", marginTop: 4 }, change: { fontSize: 12, fontWeight: "900" },
  tabs: { flexDirection: "row", borderWidth: 1, borderRadius: 15, padding: 4, marginBottom: 24 }, tab: { flex: 1, minHeight: 42, borderRadius: 11, alignItems: "center", justifyContent: "center" }, tabText: { fontSize: 13, fontWeight: "900" },
  sectionTitle: { fontSize: 25, lineHeight: 30, fontWeight: "900", letterSpacing: -0.5 }, sectionHelp: { fontSize: 13, lineHeight: 19, marginTop: 6, marginBottom: 15 }, grid: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  goalCard: { width: "47%", flexGrow: 1, minHeight: 110, borderWidth: 1, borderRadius: 18, padding: 12, justifyContent: "flex-end", position: "relative" }, mark: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center", marginBottom: 10 }, markText: { fontSize: 11, fontWeight: "900", letterSpacing: 0.4 }, goalText: { fontSize: 13, lineHeight: 17, fontWeight: "900", paddingRight: 12 }, check: { position: "absolute", top: 12, right: 12, fontSize: 15, fontWeight: "900" },
  input: { minHeight: 56, borderRadius: 16, borderWidth: 1, paddingHorizontal: 15, fontSize: 14, marginTop: 12 }, selectedStrip: { borderTopWidth: 1, marginTop: 20, paddingTop: 16, flexDirection: "row", alignItems: "baseline", gap: 8 }, selectedCount: { fontSize: 28, fontWeight: "900" }, selectedText: { fontSize: 12, fontWeight: "800" },
  footer: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 22, paddingTop: 12, paddingBottom: 18 }, button: { minHeight: 58, borderRadius: 16, alignItems: "center", justifyContent: "center" }, buttonText: { fontSize: 15, fontWeight: "900" }, disabled: { opacity: 0.38 },
});
