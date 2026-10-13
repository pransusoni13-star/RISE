import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { loadProfile, PersonalizedMission, RiseProfile } from "../services/personalization";
import { spiritualPractice, spiritualResource, spiritualVideoSearch } from "../services/spiritualResources";
import { missionRepository, MissionStatus } from "../services/missionRepository";
import { missionResultQuality } from "../services/missionProgress";
import { reflectionQuality } from "../services/proofValidation";
import { useRiseAppearance } from "../services/appearance";

const fallbackMission: PersonalizedMission = {
  id: "personal-day-1",
  day: 1,
  title: "Define your 1% target",
  description: "Choose one small, useful improvement you can complete today.",
  steps: [
    "Work on it without switching tasks.",
    "Review the result, improve the weakest part once, and save the final version.",
  ],
  skills: ["Focus", "Execution", "Reflection"],
  duration: 30,
  difficulty: "Starter",
  reward: 40,
  coinReward: 10,
  proof: "Attach a screenshot/photo or short video showing the finished work.",
  skillId: "foundations",
  goal: "personal",
  track: "life",
  focusSkill: "Focus",
  resourceLabel: "Find a practical beginner example",
  resourceUrl: "https://www.youtube.com/results?search_query=deliberate+practice+beginner",
  guideLabel: "Reliable step-by-step guide",
  guideUrl: "https://www.khanacademy.org/college-careers-more/learnstorm-growth-mindset-activities-us",
  why: "A specific baseline makes every later improvement measurable.",
  onePercent: "Today you are turning a vague intention into one measurable improvement.",
  successCriteria: "All steps are checked and clear visual evidence is attached.",
};

export default function ActionScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useRiseAppearance();
  const params = useLocalSearchParams();
  const [reflection, setReflection] = useState("");
  const [chosenResult, setChosenResult] = useState("");
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [status, setStatus] = useState<MissionStatus>("not_started");
  const [saving, setSaving] = useState(false);
  const [showGuidance, setShowGuidance] = useState(false);
  const [footerHeight, setFooterHeight] = useState(96);
  const saveLock = useRef(false);
  const loadedMissionId = useRef<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const resultY = useRef(0);
  const stepsY = useRef(0);
  const reflectionY = useRef(0);
  const [faithProfile, setFaithProfile] = useState<RiseProfile | null>(null);

  const mission = useMemo(() => {
    const raw = Array.isArray(params.mission) ? params.mission[0] : params.mission;
    if (!raw) return fallbackMission;
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return fallbackMission;
      const candidate = { ...fallbackMission, ...parsed };
      if (![candidate.steps, candidate.skills].every(value => Array.isArray(value) && value.length > 0 && value.length <= 20 && value.every(item => typeof item === "string" && item.length <= 3000))) return fallbackMission;
      if (!["id", "title", "description", "goal", "skillId", "resourceUrl", "successCriteria", "why", "onePercent", "difficulty", "proof", "resourceLabel"].every(key => typeof candidate[key] === "string")) return fallbackMission;
      if (!["guideLabel", "guideUrl", "coachTip", "ifStuck", "safetyNote", "sourceNote", "resourceNote", "mapQuery", "reflectionPrompt"].every(key => candidate[key] === undefined || typeof candidate[key] === "string")) return fallbackMission;
      if (!["day", "duration", "reward", "coinReward"].every(key => Number.isFinite(candidate[key]) && candidate[key] >= 0 && candidate[key] <= 1440)) return fallbackMission;
      return candidate as PersonalizedMission;
    } catch {
      return fallbackMission;
    }
  }, [params.mission]);
  const reflectionReview = useMemo(() => reflectionQuality(reflection), [reflection]);
  const resultReview = useMemo(() => missionResultQuality(chosenResult), [chosenResult]);
  const isSpiritual = Boolean(mission.sourceNote);
  const faithSource = isSpiritual ? spiritualResource(faithProfile?.spiritualTradition) : undefined;
  const resultReady = resultReview.passed;
  const stepsReady = completedSteps.length === mission.steps.length;
  const reflectionReady = reflectionReview.passed;
  const readyForProof = resultReady && stepsReady && reflectionReady;
  const completedMilestones = Number(resultReady) + Number(stepsReady) + Number(reflectionReady);
  const missionProgress = Math.round((completedMilestones / 3) * 100);
  const nextMove = !resultReady
    ? "Name the win you will finish."
    : !stepsReady
      ? `${mission.steps.length - completedSteps.length} move${mission.steps.length - completedSteps.length === 1 ? "" : "s"} left. Keep going.`
      : !reflectionReady
        ? "Capture what changed in 2–3 sentences."
        : "You earned proof time. Show the work.";

  useEffect(() => {
    if (!isSpiritual) return;
    let active = true;
    void loadProfile().then((profile) => { if (active) setFaithProfile(profile); });
    return () => { active = false; };
  }, [isSpiritual]);

  useEffect(() => {
    loadedMissionId.current = null;
    missionRepository.get(mission.id).then((record) => {
      const storedResult = record.chosenResult || "";
      loadedMissionId.current = mission.id;
      setChosenResult(storedResult);
      setCompletedSteps(Array.from(new Set(record.completedSteps.filter((step) => step >= 0 && step < mission.steps.length))));
      setReflection(record.reflection || "");
      setStatus(record.status);
    });
  }, [mission.id, mission.steps.length]);

  useEffect(() => {
    if (loadedMissionId.current !== mission.id || status === "completed") return;
    const timer = setTimeout(() => {
      const nextStatus: MissionStatus = !resultReview.passed && completedSteps.length === 0
        ? "not_started"
        : resultReview.passed && completedSteps.length === mission.steps.length
          ? "proof_required"
          : "in_progress";
      setStatus(nextStatus);
      void missionRepository.patch(mission.id, {
        chosenResult: resultReview.normalized,
        completedSteps,
        status: nextStatus,
        ...(resultReview.passed || completedSteps.length ? { startedAt: new Date().toISOString() } : {}),
      }).catch(() => undefined);
    }, 350);
    return () => clearTimeout(timer);
  }, [chosenResult, completedSteps, mission.id, mission.steps.length, resultReview.normalized, resultReview.passed, status]);

  const toggleStep = async (index: number) => {
    if (status === "completed" || saveLock.current) return;
    saveLock.current = true;
    setSaving(true);
    const next = completedSteps.includes(index)
      ? completedSteps.filter((item) => item !== index)
      : [...completedSteps, index];
    const nextStatus: MissionStatus = next.length === mission.steps.length ? "proof_required" : "in_progress";
    try {
    await missionRepository.patch(mission.id, {
      completedSteps: next,
      status: nextStatus,
      startedAt: new Date().toISOString(),
    });
    setCompletedSteps(next);
    setStatus(nextStatus);
    } catch {
      Alert.alert("Step wasn’t saved", "Please try again. Your previous progress has not changed.");
    } finally { saveLock.current = false; setSaving(false); }
  };

  const openLink = async (url: string) => {
    try {
      if (new URL(url).protocol !== "https:") throw new Error("Unsupported resource link");
      await Linking.openURL(url);
    } catch {
      Alert.alert("Could not open link", "Please try again.");
    }
  };

  const continueToProof = async () => {
    if (saveLock.current || !resultReview.passed || !reflectionReview.passed || completedSteps.length !== mission.steps.length) return;
    saveLock.current = true;
    setSaving(true);
    try {
    await missionRepository.patch(mission.id, { status: status === "completed" ? "completed" : "proof_required", chosenResult: resultReview.normalized, reflection: reflection.trim() });
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
        duration: String(mission.duration),
        missionContext: [mission.title, resultReview.normalized, mission.description, mission.successCriteria, ...mission.skills].join(" "),
      },
    } as any);
    } catch {
      Alert.alert("Couldn’t save your check-in", "Your reflection is still here. Try again before continuing.");
    } finally { saveLock.current = false; setSaving(false); }
  };

  const handlePrimaryAction = () => {
    if (readyForProof) {
      void continueToProof();
      return;
    }
    const y = !resultReady ? resultY.current : !stepsReady ? stepsY.current : reflectionY.current;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - 18), animated: true });
  };

  return (
    <KeyboardAvoidingView style={[styles.page, { backgroundColor: theme.background }]} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={8}>
      <ScrollView ref={scrollRef} contentContainerStyle={[styles.content, { paddingTop: insets.top + 14, paddingBottom: footerHeight + insets.bottom + 28 }]} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
          <View style={styles.topRow}>
            <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.back}><Text style={[styles.backText, { color: theme.muted }]}>Back</Text></Pressable>
            <Text style={[styles.day, { color: theme.accent }]}>DAY {mission.day}</Text>
          </View>
          <Text style={[styles.trackLabel, { color: theme.accent }]}>{mission.track.toUpperCase()} · {mission.focusSkill}</Text>
          <Text style={[styles.title, { color: theme.text }]}>{mission.title}</Text>
          <Text style={[styles.description, { color: theme.muted }]} numberOfLines={3}>{mission.description}</Text>
          <Text style={[styles.heroMeta, { color: theme.muted }]}>{mission.duration} MIN · {mission.difficulty.toUpperCase()} · +{mission.reward} XP</Text>
        </View>

        <View style={[styles.mapCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.mapTop}><Text style={[styles.mapEyebrow, { color: theme.muted }]}>MISSION PROGRESS</Text><Text style={[styles.mapPercent, { color: theme.accent }]}>{completedMilestones} / 3</Text></View>
          <View style={[styles.progressTrack, { backgroundColor: theme.surfaceStrong }]}><View style={[styles.progressFill, { backgroundColor: theme.accent, width: `${missionProgress}%` as `${number}%` }]} /></View>
          <Text style={[styles.nextMove, { color: theme.text }]}>{readyForProof ? "Mission ready for proof." : nextMove}</Text>
        </View>

        <View onLayout={(event) => { resultY.current = event.nativeEvent.layout.y; }} style={[styles.stageCard, { backgroundColor: resultReady ? theme.surfaceStrong : theme.surface, borderColor: resultReady ? theme.accent : theme.border }]}> 
          <View style={styles.stageHeader}>
            <View style={[styles.stageNumber, { backgroundColor: resultReady ? theme.accent : theme.surfaceStrong }]}><Text style={[styles.stageNumberText, { color: resultReady ? theme.accentInk : theme.text }]}>{resultReady ? "✓" : "1"}</Text></View>
            <View style={styles.stageHeading}><Text style={[styles.stageEyebrow, { color: theme.accent }]}>{resultReady ? "WIN LOCKED" : "FIRST MOVE"}</Text><Text style={[styles.stageTitle, { color: theme.text }]}>Choose today’s win</Text></View>
          </View>
          <Text style={[styles.stagePrompt, { color: theme.text }]}>What will be finished—not just started?</Text>
          <TextInput
            accessibilityLabel="My chosen mission result"
            style={[styles.missionInput, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
            placeholder={`Example: Finish one ${mission.focusSkill} result I can show.`}
            placeholderTextColor={theme.muted}
            value={chosenResult}
            onChangeText={setChosenResult}
            maxLength={240}
            returnKeyType="done"
            onSubmitEditing={() => Keyboard.dismiss()}
          />
          <Text style={[styles.hint, { color: resultReady ? theme.accent : theme.muted }, resultReady && styles.hintReady]}>{resultReady ? "✓ Clear, specific, and saved" : resultReview.message}</Text>
        </View>

        <View onLayout={(event) => { stepsY.current = event.nativeEvent.layout.y; }} style={[styles.stageCard, { backgroundColor: stepsReady ? theme.surfaceStrong : theme.surface, borderColor: stepsReady ? theme.accent : theme.border }, styles.stepsStage]}> 
          <View style={styles.stageHeader}>
            <View style={[styles.stageNumber, { backgroundColor: stepsReady ? theme.accent : theme.surfaceStrong }]}><Text style={[styles.stageNumberText, { color: stepsReady ? theme.accentInk : theme.text }]}>{stepsReady ? "✓" : "2"}</Text></View>
            <View style={styles.stageHeading}><Text style={[styles.stageEyebrow, { color: theme.accent }]}>{completedSteps.length}/{mission.steps.length} MOVES</Text><Text style={[styles.stageTitle, { color: theme.text }]}>Do the mission</Text></View>
          </View>
          <View style={[styles.miniProgress, { backgroundColor: theme.surfaceStrong }]}><View style={[styles.miniProgressFill, { backgroundColor: theme.accent, width: `${Math.round((completedSteps.length / mission.steps.length) * 100)}%` as `${number}%` }]} /></View>
          {mission.steps.map((step, index) => {
            const done = completedSteps.includes(index);
            return <Pressable accessibilityRole="checkbox" disabled={saving || status === "completed"} accessibilityHint="Double tap only after you complete this action" accessibilityState={{ checked: done, disabled: saving || status === "completed" }} key={`${index}-${step}`} style={[styles.stepCard, { backgroundColor: theme.surfaceStrong, borderColor: done ? theme.accent : theme.border }]} onPress={() => toggleStep(index)}>
              <View style={[styles.stepNumber, { borderColor: done ? theme.accent : theme.border, backgroundColor: done ? theme.accent : "transparent" }]}><Text style={[styles.stepNumberText, { color: done ? theme.accentInk : theme.accent }]}>{done ? "✓" : index + 1}</Text></View>
              <View style={styles.stepBody}><Text style={[styles.stepText, { color: done ? theme.muted : theme.text }]}>{step}</Text><Text style={[styles.stepAction, { color: theme.accent }]}>{done ? "DONE" : "TAP WHEN DONE"}</Text></View>
            </Pressable>;
          })}
          <View style={[styles.finishLine, { backgroundColor: theme.surfaceStrong }]}><View style={styles.finishBody}><Text style={[styles.finishLabel, { color: theme.accent }]}>THE FINISH LINE</Text><Text style={[styles.finishText, { color: theme.text }]}>{mission.successCriteria}</Text></View></View>
        </View>

        <View onLayout={(event) => { reflectionY.current = event.nativeEvent.layout.y; }} style={[styles.stageCard, { backgroundColor: reflectionReady ? theme.surfaceStrong : theme.surface, borderColor: reflectionReady ? theme.accent : theme.border }, !stepsReady && styles.stageCardLocked]}> 
          <View style={styles.stageHeader}>
            <View style={[styles.stageNumber, { backgroundColor: reflectionReady ? theme.accent : theme.surfaceStrong }]}><Text style={[styles.stageNumberText, { color: reflectionReady ? theme.accentInk : theme.text }]}>{reflectionReady ? "✓" : "3"}</Text></View>
            <View style={styles.stageHeading}><Text style={[styles.stageEyebrow, { color: theme.accent }]}>{stepsReady ? "FINAL MOVE" : "UNLOCKS NEXT"}</Text><Text style={[styles.stageTitle, { color: theme.text }]}>Lock in the lesson</Text></View>
          </View>
          {stepsReady ? <>
            <View style={styles.promptRow}><Text style={[styles.promptNumber, { backgroundColor: theme.surfaceStrong, color: theme.accent }]}>1</Text><Text style={[styles.promptText, { color: theme.text }]}>What did you make or practise?</Text></View>
            <View style={styles.promptRow}><Text style={[styles.promptNumber, { backgroundColor: theme.surfaceStrong, color: theme.accent }]}>2</Text><Text style={[styles.promptText, { color: theme.text }]}>What did you learn or improve?</Text></View>
            <TextInput
              accessibilityLabel="Mission reflection"
              style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
              placeholder={mission.reflectionPrompt || "Two honest sentences…"}
              placeholderTextColor={theme.muted}
              multiline
              maxLength={1200}
              blurOnSubmit
              returnKeyType="done"
              onSubmitEditing={() => Keyboard.dismiss()}
              value={reflection}
              onChangeText={setReflection}
            />
            <Text style={[styles.hint, { color: reflectionReady ? theme.accent : theme.muted }, reflectionReady && styles.hintReady]}>{reflectionReady ? `✓ Reflection ready · ${reflectionReview.sentenceCount} sentences` : reflectionReview.message}</Text>
          </> : <Text style={[styles.lockedText, { color: theme.muted }]}>Finish every move above to unlock your reflection.</Text>}
        </View>

        <Pressable accessibilityRole="button" accessibilityState={{ expanded: showGuidance }} onPress={() => setShowGuidance((value) => !value)} style={({ pressed }) => [styles.helpToggle, { backgroundColor: theme.surface, borderColor: theme.border }, pressed && styles.pressed]}>
          <View style={styles.helpBody}><Text style={[styles.helpTitle, { color: theme.text }]}>Need a boost?</Text><Text style={[styles.helpText, { color: theme.muted }]}>Coach tips, safety and useful resources</Text></View>
          <Text style={[styles.helpArrow, { color: theme.accent }]}>{showGuidance ? "−" : "+"}</Text>
        </Pressable>

        {showGuidance ? <View style={styles.helpDrawer}>
          <View style={[styles.whyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}><Text style={[styles.whyLabel, { color: theme.accent }]}>WHY THIS MISSION</Text><Text style={[styles.whyText, { color: theme.text }]}>{mission.why}</Text></View>
          <View style={[styles.onePercentCard, { backgroundColor: theme.surface }]}><Text style={[styles.onePercentLabel, { color: theme.accent }]}>YOUR 1% TODAY</Text><Text style={[styles.onePercentText, { color: theme.text }]}>{mission.onePercent}</Text></View>
          <View style={[styles.coachCard, { backgroundColor: theme.surface, borderColor: theme.border }]}><Text style={[styles.coachLabel, { color: theme.accent }]}>COACH TIP</Text><Text style={[styles.coachText, { color: theme.text }]}>{mission.coachTip || "Finish a small version first, then improve one visible detail."}</Text><Text style={[styles.stuckLabel, { color: theme.accent }]}>STUCK?</Text><Text style={[styles.coachText, { color: theme.text }]}>{mission.ifStuck || "Shrink it to one five-minute attempt."}</Text></View>
          <View style={[styles.safetyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}><Text style={[styles.safetyLabel, { color: theme.accent }]}>KEEP IT SAFE</Text><Text style={[styles.safetyText, { color: theme.muted }]}>{mission.safetyNote || "Protect private information and simplify anything that feels unsafe."}</Text></View>
          {mission.resourceNote ? <View style={[styles.resourceNote, { backgroundColor: theme.surface, borderColor: theme.border }]}><Text style={[styles.resourceNoteTitle, { color: theme.accent }]}>SOURCE STANDARD</Text><Text style={[styles.resourceNoteText, { color: theme.muted }]}>{mission.resourceNote}</Text></View> : null}
          {mission.sourceNote ? <View style={[styles.sourceCard, { backgroundColor: theme.surface, borderColor: theme.border }]}><Text style={[styles.sourceTitle, { color: theme.accent }]}>A STEP FOR YOUR PATH</Text><Text style={[styles.sourceText, { color: theme.muted }]}>{spiritualPractice(mission.day, faithProfile?.trustedSources)}</Text><Text style={[styles.sourceText, { color: theme.muted }]}>{faithSource?.text || "RISE will not guess a tradition for you. "}{mission.sourceNote}</Text></View> : null}
          <ResourceButton title={isSpiritual ? `Search ${faithSource ? faithProfile?.spiritualTradition : "topic"} videos` : mission.resourceLabel} detail="Optional learning resource" disabled={isSpiritual && !faithProfile} onPress={() => openLink(isSpiritual ? spiritualVideoSearch(faithProfile?.spiritualTradition, mission.title) : mission.resourceUrl)} />
          {mission.mapQuery && !isSpiritual ? <ResourceButton title="Find useful places near you" detail={mission.mapQuery} onPress={() => openLink(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mission.mapQuery || "")}`)} /> : null}
          {faithSource ? <ResourceButton title={faithSource.label} detail="Optional reading library" onPress={() => openLink(faithSource.url)} /> : null}
          {mission.guideUrl && !isSpiritual ? <ResourceButton title={mission.guideLabel || "Publisher guide"} detail="Matched guide from a named source" onPress={() => openLink(mission.guideUrl!)} /> : null}
          <ResourceButton title="Safety, privacy or proof help" detail="Get unstuck without losing progress" arrow="›" onPress={() => router.push("/help" as any)} />
        </View> : null}
      </ScrollView>

      <View onLayout={(event) => setFooterHeight(Math.ceil(event.nativeEvent.layout.height))} style={[styles.footer, { paddingBottom: insets.bottom + 12, backgroundColor: theme.background, borderTopColor: theme.border }]}>
        <View style={styles.footerTop}><Text style={[styles.footerProgress, { color: theme.accent }]}>{completedMilestones}/3 READY</Text><Text accessibilityRole="alert" style={[styles.footerReason, { color: theme.muted }]}>{readyForProof ? "Add proof to claim your XP." : nextMove}</Text></View>
        <Pressable
          style={({ pressed }) => [styles.button, { backgroundColor: theme.accent, borderColor: theme.accent }, pressed && styles.pressed, saving && styles.disabled]}
          onPress={handlePrimaryAction}
          accessibilityRole="button"
          accessibilityState={{ disabled: saving }}
          disabled={saving}
        >
          <Text style={[styles.buttonText, { color: theme.accentInk }]}>{saving ? "Saving…" : readyForProof ? status === "completed" ? "Review my proof →" : "Add proof + finish →" : !resultReady ? "Choose my win ↓" : !stepsReady ? "Keep moving ↓" : "Write reflection ↓"}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function ResourceButton({ title, detail, onPress, disabled = false, arrow = "↗" }: { title: string; detail: string; onPress: () => void; disabled?: boolean; arrow?: string }) {
  const { theme } = useRiseAppearance();
  return <Pressable accessibilityRole="link" disabled={disabled} style={({ pressed }) => [styles.toolCard, { backgroundColor: theme.surface, borderColor: theme.border }, disabled && styles.disabled, pressed && styles.pressed]} onPress={onPress}><View style={styles.toolBody}><Text style={[styles.toolTitle, { color: theme.text }]}>{title}</Text><Text style={[styles.toolText, { color: theme.muted }]} numberOfLines={2}>{detail}</Text></View><Text style={[styles.toolArrow, { color: theme.accent }]}>{arrow}</Text></Pressable>;
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { paddingHorizontal: 18, paddingBottom: 130 },
  hero: { borderRadius: 20, borderWidth: 1, padding: 20, marginBottom: 14 },
  topRow: { flexDirection: "row", alignItems: "center", marginBottom: 18 },
  back: { minWidth: 42, minHeight: 38, justifyContent: "center", marginRight: 14 },
  backText: { fontSize: 12, fontWeight: "800" },
  day: { flex: 1, fontSize: 11, fontWeight: "900", letterSpacing: 1.5, textAlign: "right" },
  trackLabel: { fontSize: 9, fontWeight: "900", letterSpacing: 1.3 },
  title: { fontSize: 31, lineHeight: 36, fontWeight: "800", letterSpacing: -0.5, marginTop: 13, maxWidth: "92%" },
  description: { fontSize: 14, lineHeight: 21, marginTop: 9 },
  heroMeta: { fontSize: 10, fontWeight: "800", letterSpacing: .8, marginTop: 18 },
  mapCard: { borderRadius: 20, borderWidth: 1, padding: 17, marginBottom: 14 },
  mapTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  mapEyebrow: { fontSize: 9, fontWeight: "900", letterSpacing: 1.3 },
  mapPercent: { fontSize: 13, fontWeight: "900" },
  progressTrack: { height: 6, borderRadius: 3, overflow: "hidden", marginTop: 10 },
  progressFill: { height: "100%", borderRadius: 3 },
  nextMove: { fontSize: 12, lineHeight: 17, fontWeight: "700", textAlign: "center", marginTop: 13 },
  stageCard: { borderRadius: 20, borderWidth: 1, padding: 17, marginBottom: 14 },
  stageCardLocked: { opacity: 0.62 },
  stepsStage: { paddingBottom: 13 },
  stageHeader: { flexDirection: "row", alignItems: "center", marginBottom: 13 },
  stageNumber: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 11 },
  stageNumberText: { fontSize: 15, fontWeight: "900" },
  stageHeading: { flex: 1 },
  stageEyebrow: { fontSize: 8, fontWeight: "900", letterSpacing: 1.2 },
  stageTitle: { fontSize: 19, fontWeight: "900", marginTop: 3 },
  stagePrompt: { fontSize: 13, lineHeight: 19, marginBottom: 10 },
  missionInput: { minHeight: 55, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  hint: { fontSize: 11, lineHeight: 16, marginTop: 8 },
  hintReady: { fontWeight: "800" },
  miniProgress: { height: 5, borderRadius: 3, overflow: "hidden", marginBottom: 13 },
  miniProgressFill: { height: "100%", borderRadius: 3 },
  stepCard: { flexDirection: "row", alignItems: "center", borderRadius: 14, padding: 13, marginBottom: 9, borderWidth: 1 },
  stepNumber: { width: 34, height: 34, borderRadius: 11, borderWidth: 1, alignItems: "center", justifyContent: "center", marginRight: 11 },
  stepNumberText: { fontWeight: "900" },
  stepBody: { flex: 1 },
  stepText: { fontSize: 13, lineHeight: 19, fontWeight: "700" },
  stepAction: { fontSize: 8, fontWeight: "900", letterSpacing: 1, marginTop: 5 },
  finishLine: { flexDirection: "row", alignItems: "center", borderRadius: 14, padding: 12, marginTop: 3 },
  finishBody: { flex: 1 },
  finishLabel: { fontSize: 8, fontWeight: "900", letterSpacing: 1.1 },
  finishText: { fontSize: 11, lineHeight: 17, marginTop: 3 },
  promptRow: { flexDirection: "row", alignItems: "center", marginBottom: 7 },
  promptNumber: { width: 22, height: 22, borderRadius: 7, textAlign: "center", textAlignVertical: "center", fontSize: 10, fontWeight: "900", marginRight: 8, overflow: "hidden" },
  promptText: { flex: 1, fontSize: 12, fontWeight: "700" },
  input: { minHeight: 112, borderRadius: 14, borderWidth: 1, padding: 14, textAlignVertical: "top", fontSize: 14, lineHeight: 21, marginTop: 7 },
  lockedText: { fontSize: 12, lineHeight: 18 },
  helpToggle: { flexDirection: "row", alignItems: "center", borderRadius: 16, borderWidth: 1, padding: 13, marginBottom: 14 },
  helpBody: { flex: 1 },
  helpTitle: { fontSize: 14, fontWeight: "900" },
  helpText: { fontSize: 10, marginTop: 3 },
  helpArrow: { fontSize: 24, fontWeight: "500" },
  helpDrawer: { marginBottom: 2 },
  pressed: { opacity: 0.76, transform: [{ scale: 0.99 }] },
  whyCard: { borderWidth: 1, borderRadius: 16, padding: 15, marginBottom: 9 },
  whyLabel: { fontSize: 9, fontWeight: "900", letterSpacing: 1.2 },
  whyText: { fontSize: 13, lineHeight: 20, marginTop: 6 },
  onePercentCard: { borderRadius: 16, padding: 15, marginBottom: 9 },
  onePercentLabel: { fontSize: 9, fontWeight: "900", letterSpacing: 1.2 },
  onePercentText: { fontSize: 13, lineHeight: 20, marginTop: 6, fontWeight: "700" },
  coachCard: { borderRadius: 16, borderWidth: 1, padding: 15, marginBottom: 9 },
  coachLabel: { fontSize: 9, fontWeight: "900", letterSpacing: 1.2 },
  stuckLabel: { fontSize: 9, fontWeight: "900", letterSpacing: 1.2, marginTop: 13 },
  coachText: { fontSize: 13, lineHeight: 20, marginTop: 6 },
  safetyCard: { borderRadius: 16, borderWidth: 1, padding: 15, marginBottom: 9 },
  safetyLabel: { fontSize: 9, fontWeight: "900", letterSpacing: 1.2 },
  safetyText: { fontSize: 12, lineHeight: 19, marginTop: 6 },
  sourceCard: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 10 },
  sourceTitle: { fontSize: 9, fontWeight: "900", letterSpacing: 1.1 },
  resourceNote: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 10 },
  resourceNoteTitle: { fontSize: 9, fontWeight: "900", letterSpacing: 1.1, marginBottom: 5 },
  resourceNoteText: { fontSize: 12, lineHeight: 18 },
  sourceText: { fontSize: 11, lineHeight: 18, marginTop: 6 },
  toolCard: { flexDirection: "row", alignItems: "center", borderRadius: 14, padding: 14, marginBottom: 9, borderWidth: 1 },
  toolBody: { flex: 1 },
  toolTitle: { fontSize: 13, fontWeight: "900" },
  toolText: { fontSize: 11, marginTop: 4 },
  toolArrow: { fontSize: 18 },
  footer: { paddingHorizontal: 18, paddingTop: 10, flexShrink: 0, borderTopWidth: 1 },
  footerTop: { flexDirection: "row", alignItems: "center", gap: 9, marginBottom: 8 },
  footerProgress: { fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  footerReason: { flex: 1, fontSize: 10, lineHeight: 15 },
  button: { height: 54, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  disabled: { opacity: 0.35 },
  buttonText: { fontSize: 15, fontWeight: "900" },
});
