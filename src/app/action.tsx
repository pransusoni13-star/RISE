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
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={8}>
      <ScrollView ref={scrollRef} contentContainerStyle={[styles.content, { paddingTop: insets.top + 14, paddingBottom: footerHeight + insets.bottom + 28 }]} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroBubbleLarge} />
          <View style={styles.heroBubbleSmall} />
          <View style={styles.topRow}>
            <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable>
            <Text style={styles.day}>DAY {mission.day}</Text>
            <Text style={styles.heroEmoji}>{mission.track === "life" ? "🌱" : "🚀"}</Text>
          </View>
          <Text style={styles.trackChip}>{mission.track.toUpperCase()} • {mission.focusSkill}</Text>
          <Text style={styles.title}>{mission.title}</Text>
          <Text style={styles.description} numberOfLines={3}>{mission.description}</Text>
          <View style={styles.heroMeta}>
            <Text style={styles.heroPill}>⏱ {mission.duration} min</Text>
            <Text style={styles.heroPill}>⚡ {mission.difficulty}</Text>
            <Text style={[styles.heroPill, styles.heroReward]}>+{mission.reward} XP</Text>
          </View>
        </View>

        <View style={styles.mapCard}>
          <View style={styles.mapTop}><Text style={styles.mapEyebrow}>YOUR MISSION MAP</Text><Text style={styles.mapPercent}>{missionProgress}%</Text></View>
          <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${missionProgress}%` as `${number}%` }]} /></View>
          <View style={styles.mapStops}>
            <MapStop icon="🎯" label="Choose" done={resultReady} active={!resultReady} />
            <View style={[styles.mapLine, resultReady && styles.mapLineDone]} />
            <MapStop icon="⚡" label="Do" done={stepsReady} active={resultReady && !stepsReady} />
            <View style={[styles.mapLine, stepsReady && styles.mapLineDone]} />
            <MapStop icon="💡" label="Reflect" done={reflectionReady} active={stepsReady && !reflectionReady} />
          </View>
          <Text style={styles.nextMove}>{readyForProof ? "✨ Mission ready to prove!" : nextMove}</Text>
        </View>

        <View onLayout={(event) => { resultY.current = event.nativeEvent.layout.y; }} style={[styles.stageCard, resultReady && styles.stageCardDone]}>
          <View style={styles.stageHeader}>
            <View style={[styles.stageNumber, resultReady && styles.stageNumberDone]}><Text style={styles.stageNumberText}>{resultReady ? "✓" : "1"}</Text></View>
            <View style={styles.stageHeading}><Text style={styles.stageEyebrow}>{resultReady ? "WIN LOCKED" : "FIRST MOVE"}</Text><Text style={styles.stageTitle}>Choose today’s win</Text></View>
            <Text style={styles.stageEmoji}>🎯</Text>
          </View>
          <Text style={styles.stagePrompt}>What will be finished—not just started?</Text>
          <TextInput
            accessibilityLabel="My chosen mission result"
            style={styles.missionInput}
            placeholder={`Example: Finish one ${mission.focusSkill} result I can show.`}
            placeholderTextColor="#668577"
            value={chosenResult}
            onChangeText={setChosenResult}
            maxLength={240}
            returnKeyType="done"
            onSubmitEditing={() => Keyboard.dismiss()}
          />
          <Text style={[styles.hint, resultReady && styles.hintReady]}>{resultReady ? "✓ Clear, specific, and saved" : resultReview.message}</Text>
        </View>

        <View onLayout={(event) => { stepsY.current = event.nativeEvent.layout.y; }} style={[styles.stageCard, styles.stepsStage, stepsReady && styles.stageCardDone]}>
          <View style={styles.stageHeader}>
            <View style={[styles.stageNumber, stepsReady && styles.stageNumberDone]}><Text style={styles.stageNumberText}>{stepsReady ? "✓" : "2"}</Text></View>
            <View style={styles.stageHeading}><Text style={styles.stageEyebrow}>{completedSteps.length}/{mission.steps.length} MOVES</Text><Text style={styles.stageTitle}>Do the mission</Text></View>
            <Text style={styles.stageEmoji}>⚡</Text>
          </View>
          <View style={styles.miniProgress}><View style={[styles.miniProgressFill, { width: `${Math.round((completedSteps.length / mission.steps.length) * 100)}%` as `${number}%` }]} /></View>
          {mission.steps.map((step, index) => {
            const done = completedSteps.includes(index);
            return <Pressable accessibilityRole="checkbox" disabled={saving || status === "completed"} accessibilityHint="Double tap only after you complete this action" accessibilityState={{ checked: done, disabled: saving || status === "completed" }} key={`${index}-${step}`} style={[styles.stepCard, done && styles.stepCardDone]} onPress={() => toggleStep(index)}>
              <View style={[styles.stepNumber, done && styles.stepNumberDone]}><Text style={[styles.stepNumberText, done && styles.stepNumberTextDone]}>{done ? "✓" : index + 1}</Text></View>
              <View style={styles.stepBody}><Text style={[styles.stepText, done && styles.stepTextDone]}>{step}</Text><Text style={[styles.stepAction, done && styles.stepActionDone]}>{done ? "DONE" : "TAP WHEN DONE"}</Text></View>
            </Pressable>;
          })}
          <View style={styles.finishLine}><Text style={styles.finishIcon}>🏁</Text><View style={styles.finishBody}><Text style={styles.finishLabel}>THE FINISH LINE</Text><Text style={styles.finishText}>{mission.successCriteria}</Text></View></View>
        </View>

        <View onLayout={(event) => { reflectionY.current = event.nativeEvent.layout.y; }} style={[styles.stageCard, !stepsReady && styles.stageCardLocked, reflectionReady && styles.stageCardDone]}>
          <View style={styles.stageHeader}>
            <View style={[styles.stageNumber, reflectionReady && styles.stageNumberDone]}><Text style={styles.stageNumberText}>{reflectionReady ? "✓" : "3"}</Text></View>
            <View style={styles.stageHeading}><Text style={styles.stageEyebrow}>{stepsReady ? "FINAL MOVE" : "UNLOCKS NEXT"}</Text><Text style={styles.stageTitle}>Lock in the lesson</Text></View>
            <Text style={styles.stageEmoji}>{stepsReady ? "💡" : "🔒"}</Text>
          </View>
          {stepsReady ? <>
            <View style={styles.promptRow}><Text style={styles.promptNumber}>1</Text><Text style={styles.promptText}>What did you make or practise?</Text></View>
            <View style={styles.promptRow}><Text style={styles.promptNumber}>2</Text><Text style={styles.promptText}>What did you learn or improve?</Text></View>
            <TextInput
              accessibilityLabel="Mission reflection"
              style={styles.input}
              placeholder={mission.reflectionPrompt || "Two honest sentences…"}
              placeholderTextColor="#668577"
              multiline
              maxLength={1200}
              blurOnSubmit
              returnKeyType="done"
              onSubmitEditing={() => Keyboard.dismiss()}
              value={reflection}
              onChangeText={setReflection}
            />
            <Text style={[styles.hint, reflectionReady && styles.hintReady]}>{reflectionReady ? `✓ Reflection ready · ${reflectionReview.sentenceCount} sentences` : reflectionReview.message}</Text>
          </> : <Text style={styles.lockedText}>Finish every move above to unlock your reflection.</Text>}
        </View>

        <Pressable accessibilityRole="button" accessibilityState={{ expanded: showGuidance }} onPress={() => setShowGuidance((value) => !value)} style={({ pressed }) => [styles.helpToggle, pressed && styles.pressed]}>
          <View style={styles.helpIcon}><Text style={styles.helpIconText}>🧰</Text></View>
          <View style={styles.helpBody}><Text style={styles.helpTitle}>Need a boost?</Text><Text style={styles.helpText}>Coach tips, safety and useful resources</Text></View>
          <Text style={styles.helpArrow}>{showGuidance ? "−" : "+"}</Text>
        </Pressable>

        {showGuidance ? <View style={styles.helpDrawer}>
          <View style={styles.whyCard}><Text style={styles.whyLabel}>WHY THIS MISSION</Text><Text style={styles.whyText}>{mission.why}</Text></View>
          <View style={styles.onePercentCard}><Text style={styles.onePercentLabel}>YOUR 1% TODAY</Text><Text style={styles.onePercentText}>{mission.onePercent}</Text></View>
          <View style={styles.coachCard}><Text style={styles.coachLabel}>COACH TIP</Text><Text style={styles.coachText}>{mission.coachTip || "Finish a small version first, then improve one visible detail."}</Text><Text style={styles.stuckLabel}>STUCK?</Text><Text style={styles.coachText}>{mission.ifStuck || "Shrink it to one five-minute attempt."}</Text></View>
          <View style={styles.safetyCard}><Text style={styles.safetyLabel}>🛡️ KEEP IT SAFE</Text><Text style={styles.safetyText}>{mission.safetyNote || "Protect private information and simplify anything that feels unsafe."}</Text></View>
          {mission.resourceNote ? <View style={styles.resourceNote}><Text style={styles.resourceNoteTitle}>SOURCE STANDARD</Text><Text style={styles.resourceNoteText}>{mission.resourceNote}</Text></View> : null}
          {mission.sourceNote ? <View style={styles.sourceCard}><Text style={styles.sourceTitle}>A STEP FOR YOUR PATH</Text><Text style={styles.sourceText}>{spiritualPractice(mission.day, faithProfile?.trustedSources)}</Text><Text style={styles.sourceText}>{faithSource?.text || "RISE will not guess a tradition for you. "}{mission.sourceNote}</Text></View> : null}
          <ResourceButton icon="▶️" title={isSpiritual ? `Search ${faithSource ? faithProfile?.spiritualTradition : "topic"} videos` : mission.resourceLabel} detail="Optional learning resource" disabled={isSpiritual && !faithProfile} onPress={() => openLink(isSpiritual ? spiritualVideoSearch(faithProfile?.spiritualTradition, mission.title) : mission.resourceUrl)} />
          {mission.mapQuery && !isSpiritual ? <ResourceButton icon="📍" title="Find useful places near you" detail={mission.mapQuery} onPress={() => openLink(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mission.mapQuery || "")}`)} /> : null}
          {faithSource ? <ResourceButton icon="📖" title={faithSource.label} detail="Optional reading library" onPress={() => openLink(faithSource.url)} /> : null}
          {mission.guideUrl && !isSpiritual ? <ResourceButton icon="🔎" title={mission.guideLabel || "Publisher guide"} detail="Matched guide from a named source" onPress={() => openLink(mission.guideUrl!)} /> : null}
          <ResourceButton icon="🛟" title="Safety, privacy or proof help" detail="Get unstuck without losing progress" arrow="›" onPress={() => router.push("/help" as any)} />
        </View> : null}
      </ScrollView>

      <View onLayout={(event) => setFooterHeight(Math.ceil(event.nativeEvent.layout.height))} style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.footerTop}><Text style={styles.footerProgress}>{completedMilestones}/3 READY</Text><Text accessibilityRole="alert" style={styles.footerReason}>{readyForProof ? "Add proof to claim your XP." : nextMove}</Text></View>
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.pressed, saving && styles.disabled]}
          onPress={handlePrimaryAction}
          accessibilityRole="button"
          accessibilityState={{ disabled: saving }}
          disabled={saving}
        >
          <Text style={styles.buttonText}>{saving ? "Saving…" : readyForProof ? status === "completed" ? "Review my proof →" : "Add proof + finish →" : !resultReady ? "Choose my win ↓" : !stepsReady ? "Keep moving ↓" : "Write reflection ↓"}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function MapStop({ icon, label, done, active }: { icon: string; label: string; done: boolean; active: boolean }) {
  return <View style={styles.mapStop}><View style={[styles.mapDot, done && styles.mapDotDone, active && styles.mapDotActive]}><Text style={styles.mapDotText}>{done ? "✓" : icon}</Text></View><Text style={[styles.mapStopLabel, (done || active) && styles.mapStopLabelActive]}>{label}</Text></View>;
}

function ResourceButton({ icon, title, detail, onPress, disabled = false, arrow = "↗" }: { icon: string; title: string; detail: string; onPress: () => void; disabled?: boolean; arrow?: string }) {
  return <Pressable accessibilityRole="link" disabled={disabled} style={({ pressed }) => [styles.toolCard, disabled && styles.disabled, pressed && styles.pressed]} onPress={onPress}><View style={styles.toolIcon}><Text>{icon}</Text></View><View style={styles.toolBody}><Text style={styles.toolTitle}>{title}</Text><Text style={styles.toolText} numberOfLines={2}>{detail}</Text></View><Text style={styles.toolArrow}>{arrow}</Text></Pressable>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#010807" },
  content: { paddingHorizontal: 18, paddingBottom: 130 },
  hero: { position: "relative", overflow: "hidden", backgroundColor: "#123D2D", borderRadius: 28, borderWidth: 1, borderColor: "#3D765A", padding: 20, marginBottom: 14 },
  heroBubbleLarge: { position: "absolute", width: 160, height: 160, borderRadius: 80, backgroundColor: "rgba(122,245,184,0.10)", right: -54, top: -54 },
  heroBubbleSmall: { position: "absolute", width: 72, height: 72, borderRadius: 36, backgroundColor: "rgba(255,207,112,0.10)", right: 58, bottom: -28 },
  topRow: { flexDirection: "row", alignItems: "center", marginBottom: 18 },
  back: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(1,8,7,0.38)", alignItems: "center", justifyContent: "center", marginRight: 10 },
  backText: { color: "#DFFDEE", fontSize: 28, marginTop: -4 },
  day: { flex: 1, color: "#7AF5B8", fontSize: 11, fontWeight: "900", letterSpacing: 1.5 },
  heroEmoji: { fontSize: 31 },
  trackChip: { alignSelf: "flex-start", color: "#071B16", backgroundColor: "#7AF5B8", borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6, fontSize: 9, fontWeight: "900", overflow: "hidden" },
  title: { color: "#FFFFFF", fontSize: 31, lineHeight: 36, fontWeight: "900", marginTop: 13, maxWidth: "92%" },
  description: { color: "#C8EED9", fontSize: 14, lineHeight: 21, marginTop: 9 },
  heroMeta: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 17 },
  heroPill: { color: "#DFFDEE", backgroundColor: "rgba(1,8,7,0.34)", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, fontSize: 10, fontWeight: "800", overflow: "hidden" },
  heroReward: { color: "#071B16", backgroundColor: "#FFCF70" },
  mapCard: { backgroundColor: "#071B16", borderRadius: 22, borderWidth: 1, borderColor: "#29483B", padding: 17, marginBottom: 14 },
  mapTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  mapEyebrow: { color: "#9AB9A8", fontSize: 9, fontWeight: "900", letterSpacing: 1.3 },
  mapPercent: { color: "#7AF5B8", fontSize: 13, fontWeight: "900" },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: "#163127", overflow: "hidden", marginTop: 10 },
  progressFill: { height: "100%", borderRadius: 3, backgroundColor: "#7AF5B8" },
  mapStops: { flexDirection: "row", alignItems: "flex-start", marginTop: 15 },
  mapStop: { width: 54, alignItems: "center" },
  mapDot: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: "#315544", backgroundColor: "#10271F", alignItems: "center", justifyContent: "center" },
  mapDotDone: { backgroundColor: "#7AF5B8", borderColor: "#7AF5B8" },
  mapDotActive: { borderWidth: 2, borderColor: "#FFCF70", backgroundColor: "#352C17" },
  mapDotText: { fontSize: 15, color: "#071B16", fontWeight: "900" },
  mapStopLabel: { color: "#6E9581", fontSize: 9, fontWeight: "800", marginTop: 5 },
  mapStopLabelActive: { color: "#DFFDEE" },
  mapLine: { flex: 1, height: 2, backgroundColor: "#1E3A31", marginTop: 18, marginHorizontal: -2 },
  mapLineDone: { backgroundColor: "#7AF5B8" },
  nextMove: { color: "#DFFDEE", fontSize: 12, lineHeight: 17, fontWeight: "700", textAlign: "center", marginTop: 13 },
  stageCard: { backgroundColor: "#071B16", borderRadius: 22, borderWidth: 1, borderColor: "#29483B", padding: 17, marginBottom: 14 },
  stageCardDone: { borderColor: "#4FA77E", backgroundColor: "#09271D" },
  stageCardLocked: { opacity: 0.62 },
  stepsStage: { paddingBottom: 13 },
  stageHeader: { flexDirection: "row", alignItems: "center", marginBottom: 13 },
  stageNumber: { width: 38, height: 38, borderRadius: 13, backgroundColor: "#15392C", alignItems: "center", justifyContent: "center", marginRight: 11 },
  stageNumberDone: { backgroundColor: "#7AF5B8" },
  stageNumberText: { color: "#F5FFF9", fontSize: 15, fontWeight: "900" },
  stageHeading: { flex: 1 },
  stageEyebrow: { color: "#7AF5B8", fontSize: 8, fontWeight: "900", letterSpacing: 1.2 },
  stageTitle: { color: "#F5FFF9", fontSize: 19, fontWeight: "900", marginTop: 3 },
  stageEmoji: { fontSize: 25 },
  stagePrompt: { color: "#C8EED9", fontSize: 13, lineHeight: 19, marginBottom: 10 },
  missionInput: { minHeight: 55, borderRadius: 15, borderWidth: 1.5, borderColor: "#4A7E65", backgroundColor: "#020D0A", color: "#F5FFF9", paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  hint: { color: "#8FB6A2", fontSize: 11, lineHeight: 16, marginTop: 8 },
  hintReady: { color: "#7AF5B8", fontWeight: "800" },
  miniProgress: { height: 5, borderRadius: 3, backgroundColor: "#163127", overflow: "hidden", marginBottom: 13 },
  miniProgressFill: { height: "100%", backgroundColor: "#FFCF70", borderRadius: 3 },
  stepCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#0B211A", borderRadius: 17, padding: 13, marginBottom: 9, borderWidth: 1, borderColor: "#1E3A31" },
  stepCardDone: { borderColor: "#4FA77E", backgroundColor: "#0D2F22" },
  stepNumber: { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, borderColor: "#4A7E65", alignItems: "center", justifyContent: "center", marginRight: 11 },
  stepNumberDone: { backgroundColor: "#7AF5B8", borderColor: "#7AF5B8" },
  stepNumberText: { color: "#7AF5B8", fontWeight: "900" },
  stepNumberTextDone: { color: "#071B16" },
  stepBody: { flex: 1 },
  stepText: { color: "#E8F8EF", fontSize: 13, lineHeight: 19, fontWeight: "700" },
  stepTextDone: { color: "#A7CBB7" },
  stepAction: { color: "#FFCF70", fontSize: 8, fontWeight: "900", letterSpacing: 1, marginTop: 5 },
  stepActionDone: { color: "#7AF5B8" },
  finishLine: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,207,112,0.07)", borderRadius: 15, padding: 12, marginTop: 3 },
  finishIcon: { fontSize: 21, marginRight: 10 },
  finishBody: { flex: 1 },
  finishLabel: { color: "#FFCF70", fontSize: 8, fontWeight: "900", letterSpacing: 1.1 },
  finishText: { color: "#E9DFC3", fontSize: 11, lineHeight: 17, marginTop: 3 },
  promptRow: { flexDirection: "row", alignItems: "center", marginBottom: 7 },
  promptNumber: { width: 22, height: 22, borderRadius: 11, textAlign: "center", textAlignVertical: "center", backgroundColor: "#15392C", color: "#7AF5B8", fontSize: 10, fontWeight: "900", marginRight: 8, overflow: "hidden" },
  promptText: { flex: 1, color: "#DFFDEE", fontSize: 12, fontWeight: "700" },
  input: { minHeight: 112, borderRadius: 16, borderWidth: 1.5, borderColor: "#4A7E65", backgroundColor: "#020D0A", color: "#F5FFF9", padding: 14, textAlignVertical: "top", fontSize: 14, lineHeight: 21, marginTop: 7 },
  lockedText: { color: "#8FB6A2", fontSize: 12, lineHeight: 18 },
  helpToggle: { flexDirection: "row", alignItems: "center", backgroundColor: "#0B211A", borderRadius: 20, borderWidth: 1, borderColor: "#29483B", padding: 13, marginBottom: 14 },
  helpIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: "#15392C", alignItems: "center", justifyContent: "center", marginRight: 11 },
  helpIconText: { fontSize: 20 },
  helpBody: { flex: 1 },
  helpTitle: { color: "#F5FFF9", fontSize: 14, fontWeight: "900" },
  helpText: { color: "#8FB6A2", fontSize: 10, marginTop: 3 },
  helpArrow: { color: "#7AF5B8", fontSize: 24, fontWeight: "500" },
  helpDrawer: { marginBottom: 2 },
  pressed: { opacity: 0.76, transform: [{ scale: 0.99 }] },
  whyCard: { backgroundColor: "rgba(122,245,184,0.08)", borderWidth: 1, borderColor: "rgba(122,245,184,0.22)", borderRadius: 17, padding: 15, marginBottom: 9 },
  whyLabel: { color: "#7AF5B8", fontSize: 9, fontWeight: "900", letterSpacing: 1.2 },
  whyText: { color: "#DFFDEE", fontSize: 13, lineHeight: 20, marginTop: 6 },
  onePercentCard: { backgroundColor: "#102A22", borderRadius: 17, padding: 15, marginBottom: 9 },
  onePercentLabel: { color: "#7AF5B8", fontSize: 9, fontWeight: "900", letterSpacing: 1.2 },
  onePercentText: { color: "#F5FFF9", fontSize: 13, lineHeight: 20, marginTop: 6, fontWeight: "700" },
  coachCard: { backgroundColor: "#071B16", borderRadius: 17, borderWidth: 1, borderColor: "#29483B", padding: 15, marginBottom: 9 },
  coachLabel: { color: "#7AF5B8", fontSize: 9, fontWeight: "900", letterSpacing: 1.2 },
  stuckLabel: { color: "#FFCF70", fontSize: 9, fontWeight: "900", letterSpacing: 1.2, marginTop: 13 },
  coachText: { color: "#DFFDEE", fontSize: 13, lineHeight: 20, marginTop: 6 },
  safetyCard: { backgroundColor: "rgba(255,207,112,0.07)", borderRadius: 17, borderWidth: 1, borderColor: "rgba(255,207,112,0.25)", padding: 15, marginBottom: 9 },
  safetyLabel: { color: "#FFCF70", fontSize: 9, fontWeight: "900", letterSpacing: 1.2 },
  safetyText: { color: "#F4E8C8", fontSize: 12, lineHeight: 19, marginTop: 6 },
  sourceCard: { backgroundColor: "rgba(255,207,112,0.06)", borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,207,112,0.2)", padding: 14, marginBottom: 10 },
  sourceTitle: { color: "#FFCF70", fontSize: 9, fontWeight: "900", letterSpacing: 1.1 },
  resourceNote: { backgroundColor: "rgba(122,245,184,0.06)", borderRadius: 16, borderWidth: 1, borderColor: "rgba(122,245,184,0.2)", padding: 14, marginBottom: 10 },
  resourceNoteTitle: { color: "#7AF5B8", fontSize: 9, fontWeight: "900", letterSpacing: 1.1, marginBottom: 5 },
  resourceNoteText: { color: "#C8EED9", fontSize: 12, lineHeight: 18 },
  sourceText: { color: "#E9DFC3", fontSize: 11, lineHeight: 18, marginTop: 6 },
  toolCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#071B16", borderRadius: 16, padding: 14, marginBottom: 9, borderWidth: 1, borderColor: "#1E3A31" },
  toolIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: "#11382B", alignItems: "center", justifyContent: "center", marginRight: 11 },
  toolBody: { flex: 1 },
  toolTitle: { color: "#F5FFF9", fontSize: 13, fontWeight: "900" },
  toolText: { color: "#8FB6A2", fontSize: 11, marginTop: 4 },
  toolArrow: { color: "#7AF5B8", fontSize: 18 },
  footer: { paddingHorizontal: 18, paddingTop: 10, flexShrink: 0, backgroundColor: "#020B09", borderTopWidth: 1, borderTopColor: "#1E3A31" },
  footerTop: { flexDirection: "row", alignItems: "center", gap: 9, marginBottom: 8 },
  footerProgress: { color: "#7AF5B8", fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  footerReason: { flex: 1, color: "#A7CBB7", fontSize: 10, lineHeight: 15 },
  button: { height: 55, borderRadius: 18, borderWidth: 1, borderColor: "#B5FFD7", backgroundColor: "#7AF5B8", alignItems: "center", justifyContent: "center", elevation: 3 },
  disabled: { opacity: 0.35 },
  buttonText: { color: "#010807", fontSize: 15, fontWeight: "900" },
});
