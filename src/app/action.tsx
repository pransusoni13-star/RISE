import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { PersonalizedMission } from "../services/personalization";
import { missionRepository, MissionStatus } from "../services/missionRepository";
import { reflectionQuality } from "../services/proofValidation";

const fallbackMission: PersonalizedMission = {
  id: "personal-day-1",
  day: 1,
  title: "Define your 1% target",
  description: "Choose one small, useful improvement you can complete today.",
  steps: [
    "Write one clear result you can finish today.",
    "Work on it without switching tasks.",
    "Capture a screenshot or short video and note one lesson.",
  ],
  skills: ["Focus", "Execution", "Reflection"],
  duration: 30,
  difficulty: "Starter",
  reward: 40,
  coinReward: 10,
  proof: "Attach a screenshot/photo or short video showing the finished work.",
  skillId: "foundations",
  goal: "personal",
  resourceLabel: "Find a practical beginner example",
  resourceUrl: "https://www.youtube.com/results?search_query=deliberate+practice+beginner",
  guideLabel: "Reliable step-by-step guide",
  guideUrl: "https://www.khanacademy.org/college-careers-more/learnstorm-growth-mindset-activities-us",
  why: "A specific baseline makes every later improvement measurable.",
  onePercent: "Today you are turning a vague intention into one measurable improvement.",
  successCriteria: "All steps are checked and clear visual evidence is attached.",
};

export default function ActionScreen() {
  const params = useLocalSearchParams();
  const [reflection, setReflection] = useState("");
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [status, setStatus] = useState<MissionStatus>("not_started");

  const mission = useMemo(() => {
    const raw = Array.isArray(params.mission) ? params.mission[0] : params.mission;
    if (!raw) return fallbackMission;
    try {
      return { ...fallbackMission, ...(JSON.parse(raw) as PersonalizedMission) };
    } catch {
      return fallbackMission;
    }
  }, [params.mission]);
  const reflectionReview = useMemo(() => reflectionQuality(reflection), [reflection]);

  useEffect(() => {
    missionRepository.get(mission.id).then((record) => {
      setCompletedSteps(record.completedSteps);
      setReflection(record.reflection || "");
      setStatus(record.status);
    });
  }, [mission.id]);

  const toggleStep = async (index: number) => {
    if (status === "completed") return;
    const next = completedSteps.includes(index)
      ? completedSteps.filter((item) => item !== index)
      : [...completedSteps, index];
    setCompletedSteps(next);
    const nextStatus: MissionStatus = next.length === mission.steps.length ? "proof_required" : "in_progress";
    setStatus(nextStatus);
    await missionRepository.patch(mission.id, {
      completedSteps: next,
      status: nextStatus,
      startedAt: new Date().toISOString(),
    });
  };

  const openLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("Could not open link", "Please try again.");
    }
  };

  const continueToProof = async () => {
    if (!reflectionReview.passed || completedSteps.length !== mission.steps.length) return;
    await missionRepository.patch(mission.id, { status: "proof_required", reflection: reflection.trim() });
    router.push({
      pathname: "/proof",
      params: {
        task: mission.title,
        type: "mission",
        skillId: mission.skillId,
        goal: mission.goal,
        reward: String(mission.reward),
        coins: String(mission.coinReward),
        missionId: mission.id,
        reflection: reflection.trim(),
        missionContext: [mission.title, mission.description, mission.successCriteria, ...mission.skills].join(" "),
      },
    } as any);
  };

  return (
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={8}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <Pressable onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable>
          <Text style={styles.day}>DAY {mission.day} • YOUR 1% MISSION</Text>
        </View>

        <Text style={styles.title}>{mission.title}</Text>
        <Text style={styles.description}>{mission.description}</Text>

        <View style={styles.infoRow}>
          <Info label="TIME" value={`${mission.duration} min`} />
          <Info label="LEVEL" value={mission.difficulty} />
      <Info label="REWARD" value={`+${mission.reward} XP`} accent />
        </View>

        <View style={styles.whyCard}>
          <Text style={styles.whyLabel}>WHY THIS IS NEXT</Text>
          <Text style={styles.whyText}>{mission.why}</Text>
        </View>

        <View style={styles.onePercentCard}>
          <Text style={styles.onePercentLabel}>YOUR 1% TODAY</Text>
          <Text style={styles.onePercentText}>{mission.onePercent}</Text>
        </View>

        <View style={styles.coachCard}>
          <Text style={styles.coachLabel}>PERSONAL COACH NOTE</Text>
          <Text style={styles.coachText}>{mission.coachTip || "Finish a small version first, then improve one visible detail."}</Text>
          <Text style={styles.stuckLabel}>IF YOU GET STUCK</Text>
          <Text style={styles.coachText}>{mission.ifStuck || "Shrink the task to one five-minute attempt and learn from it."}</Text>
        </View>

        <View style={styles.safetyCard}>
          <Text style={styles.safetyLabel}>SAFE PRACTICE</Text>
          <Text style={styles.safetyText}>{mission.safetyNote || "Protect private information and stop or simplify any step that feels unsafe."}</Text>
        </View>

        <Text style={styles.section}>DO THIS INSIDE RISE</Text>
        {mission.steps.map((step, index) => (
          <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: completedSteps.includes(index), disabled: status === "completed" }} key={`${index}-${step}`} style={[styles.stepCard, completedSteps.includes(index) && styles.stepCardDone]} onPress={() => toggleStep(index)}>
            <View style={[styles.stepNumber, completedSteps.includes(index) && styles.stepNumberDone]}><Text style={styles.stepNumberText}>{completedSteps.includes(index) ? "✓" : index + 1}</Text></View>
            <Text style={[styles.stepText, completedSteps.includes(index) && styles.stepTextDone]}>{step}</Text>
          </Pressable>
        ))}

        <View style={styles.successCard}><Text style={styles.successLabel}>SUCCESS LOOKS LIKE</Text><Text style={styles.successText}>{mission.successCriteria}</Text></View>

        <Text style={styles.section}>HELPFUL TOOLS</Text>
        {mission.sourceNote ? <View style={styles.sourceCard}><Text style={styles.sourceTitle}>HOW TO CHECK A SOURCE</Text><Text style={styles.sourceText}>{mission.sourceNote}</Text></View> : null}
        <Pressable style={styles.toolCard} onPress={() => openLink(mission.resourceUrl)}>
          <View style={styles.toolIcon}><Text>▶️</Text></View>
          <View style={styles.toolBody}>
            <Text style={styles.toolTitle}>{mission.resourceLabel}</Text>
            <Text style={styles.toolText}>Full-length learning search for this exact day · Shorts excluded from the query</Text>
          </View>
          <Text style={styles.toolArrow}>↗</Text>
        </Pressable>

        {mission.mapQuery ? (
          <Pressable
            style={styles.toolCard}
            onPress={() => openLink(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mission.mapQuery || "")}`)}
          >
            <View style={styles.toolIcon}><Text>📍</Text></View>
            <View style={styles.toolBody}>
              <Text style={styles.toolTitle}>Find useful places near you</Text>
              <Text style={styles.toolText}>{mission.mapQuery}</Text>
            </View>
            <Text style={styles.toolArrow}>↗</Text>
          </Pressable>
        ) : null}

        {mission.guideUrl ? <Pressable accessibilityRole="link" style={styles.toolCard} onPress={() => openLink(mission.guideUrl!)}>
          <View style={styles.toolIcon}><Text>🔎</Text></View>
          <View style={styles.toolBody}><Text style={styles.toolTitle}>{mission.guideLabel || "Reliable step-by-step guide"}</Text><Text style={styles.toolText}>A direct source selected for this mission—not a general Google search</Text></View>
          <Text style={styles.toolArrow}>↗</Text>
        </Pressable> : null}

        <Pressable style={styles.toolCard} onPress={() => router.push("/help" as any)}>
          <View style={styles.toolIcon}><Text>🛟</Text></View>
          <View style={styles.toolBody}><Text style={styles.toolTitle}>Safety, privacy, or proof help</Text><Text style={styles.toolText}>Get unstuck without losing your progress</Text></View>
          <Text style={styles.toolArrow}>›</Text>
        </Pressable>

        <Text style={styles.section}>YOUR CHECK-IN</Text>
        <Text style={styles.reflectionGuide}>Write 2–3 complete sentences: what you made or practiced, what you learned, and what you will improve next.</Text>
        <TextInput
          style={styles.input}
          placeholder={mission.reflectionPrompt || "What did you make, learn, or improve?"}
          placeholderTextColor="#668577"
          multiline
          blurOnSubmit
          returnKeyType="done"
          onSubmitEditing={() => Keyboard.dismiss()}
          value={reflection}
          onChangeText={setReflection}
        />
        <Text style={[styles.hint, reflectionReview.passed && styles.hintReady]}>{reflectionReview.passed ? `✓ Reflection ready · ${reflectionReview.sentenceCount} sentences · ${reflectionReview.wordCount} words` : reflectionReview.message}</Text>
        <Text style={styles.hint}>Next: attach a screenshot, photo, or short video. A text-only completion will not count.</Text>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.button, (!reflectionReview.passed || completedSteps.length !== mission.steps.length) && styles.disabled]}
          onPress={continueToProof}
          disabled={!reflectionReview.passed || completedSteps.length !== mission.steps.length}
        >
          <Text style={styles.buttonText}>Attach Proof to Complete →</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function Info({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return <View style={styles.info}><Text style={styles.infoLabel}>{label}</Text><Text style={[styles.infoValue, accent && styles.accent]}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#010807" },
  content: { padding: 22, paddingTop: 48, paddingBottom: 130 },
  topRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 28 },
  back: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: "#29483B", alignItems: "center", justifyContent: "center" },
  backText: { color: "#7AF5B8", fontSize: 28, marginTop: -4 },
  day: { color: "#7AF5B8", fontSize: 10, fontWeight: "900", letterSpacing: 1.3 },
  title: { color: "#F5FFF9", fontSize: 36, lineHeight: 42, fontWeight: "900" },
  description: { color: "#C8EED9", fontSize: 15, lineHeight: 23, marginTop: 12, marginBottom: 20 },
  infoRow: { flexDirection: "row", gap: 8, marginBottom: 18 },
  info: { flex: 1, backgroundColor: "#071B16", borderWidth: 1, borderColor: "#1E3A31", borderRadius: 14, padding: 11 },
  infoLabel: { color: "#6E9581", fontSize: 8, fontWeight: "900", letterSpacing: 1 },
  infoValue: { color: "#F5FFF9", fontSize: 11, fontWeight: "900", marginTop: 5 },
  accent: { color: "#7AF5B8" },
  whyCard: { backgroundColor: "rgba(122,245,184,0.08)", borderWidth: 1, borderColor: "rgba(122,245,184,0.22)", borderRadius: 17, padding: 15, marginBottom: 25 },
  whyLabel: { color: "#7AF5B8", fontSize: 9, fontWeight: "900", letterSpacing: 1.2 },
  whyText: { color: "#DFFDEE", fontSize: 13, lineHeight: 20, marginTop: 6 },
  onePercentCard: { backgroundColor: "#102A22", borderRadius: 17, padding: 15, marginBottom: 20 },
  onePercentLabel: { color: "#7AF5B8", fontSize: 9, fontWeight: "900", letterSpacing: 1.2 },
  onePercentText: { color: "#F5FFF9", fontSize: 13, lineHeight: 20, marginTop: 6, fontWeight: "700" },
  coachCard: { backgroundColor: "#071B16", borderRadius: 17, borderWidth: 1, borderColor: "#29483B", padding: 15, marginBottom: 20 },
  coachLabel: { color: "#7AF5B8", fontSize: 9, fontWeight: "900", letterSpacing: 1.2 },
  stuckLabel: { color: "#FFCF70", fontSize: 9, fontWeight: "900", letterSpacing: 1.2, marginTop: 13 },
  coachText: { color: "#DFFDEE", fontSize: 13, lineHeight: 20, marginTop: 6 },
  safetyCard: { backgroundColor: "rgba(255,207,112,0.07)", borderRadius: 17, borderWidth: 1, borderColor: "rgba(255,207,112,0.25)", padding: 15, marginBottom: 20 },
  safetyLabel: { color: "#FFCF70", fontSize: 9, fontWeight: "900", letterSpacing: 1.2 },
  safetyText: { color: "#F4E8C8", fontSize: 12, lineHeight: 19, marginTop: 6 },
  sourceCard: { backgroundColor: "rgba(255,207,112,0.06)", borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,207,112,0.2)", padding: 14, marginBottom: 10 },
  sourceTitle: { color: "#FFCF70", fontSize: 9, fontWeight: "900", letterSpacing: 1.1 },
  sourceText: { color: "#E9DFC3", fontSize: 11, lineHeight: 18, marginTop: 6 },
  section: { color: "#9AB9A8", fontSize: 11, fontWeight: "900", letterSpacing: 1.3, marginTop: 8, marginBottom: 12 },
  stepCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#071B16", borderRadius: 16, padding: 14, marginBottom: 9, borderWidth: 1, borderColor: "#1E3A31" },
  stepCardDone: { borderColor: "#4FA77E", backgroundColor: "#0D2F22" },
  stepNumber: { width: 30, height: 30, borderRadius: 15, backgroundColor: "#11382B", alignItems: "center", justifyContent: "center", marginRight: 12 },
  stepNumberText: { color: "#7AF5B8", fontWeight: "900" },
  stepNumberDone: { backgroundColor: "#7AF5B8" },
  stepText: { color: "#E8F8EF", fontSize: 13, lineHeight: 19, flex: 1 },
  stepTextDone: { color: "#9AB9A8", textDecorationLine: "line-through" },
  successCard: { borderRadius: 15, borderWidth: 1, borderColor: "#29483B", padding: 14, marginBottom: 20 },
  successLabel: { color: "#8FB6A2", fontSize: 9, fontWeight: "900", letterSpacing: 1.1 },
  successText: { color: "#DFFDEE", fontSize: 12, lineHeight: 18, marginTop: 5 },
  toolCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#071B16", borderRadius: 16, padding: 14, marginBottom: 9, borderWidth: 1, borderColor: "#1E3A31" },
  toolIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: "#11382B", alignItems: "center", justifyContent: "center", marginRight: 11 },
  toolBody: { flex: 1 },
  toolTitle: { color: "#F5FFF9", fontSize: 13, fontWeight: "900" },
  toolText: { color: "#8FB6A2", fontSize: 11, marginTop: 4 },
  toolArrow: { color: "#7AF5B8", fontSize: 18 },
  reflectionGuide: { color: "#A7CBB7", fontSize: 12, lineHeight: 18, marginTop: -8, marginBottom: 10 },
  input: { minHeight: 105, borderRadius: 17, borderWidth: 1, borderColor: "#29483B", backgroundColor: "#071B16", color: "#F5FFF9", padding: 15, textAlignVertical: "top", fontSize: 14, lineHeight: 21 },
  hint: { color: "#8FB6A2", fontSize: 11, lineHeight: 17, marginTop: 9 },
  hintReady: { color: "#7AF5B8" },
  footer: { position: "absolute", left: 22, right: 22, bottom: 22 },
  button: { height: 58, borderRadius: 29, backgroundColor: "#7AF5B8", alignItems: "center", justifyContent: "center" },
  disabled: { opacity: 0.35 },
  buttonText: { color: "#010807", fontSize: 15, fontWeight: "900" },
});
