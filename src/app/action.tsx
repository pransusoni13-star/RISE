import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
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
import {
  parseMissionPayload,
  type PersonalizedMission,
  updateProfile,
} from "../services/personalization";
import {
  missionRepository,
  type MissionRecord,
} from "../services/missionRepository";
import { completeMission } from "../services/missionCompletion";
import { recordProgressEvent } from "../services/auth";
import { useRiseAppearance } from "../services/appearance";
import { LoadFailure, LoadPending } from "../components/load-failure";

export default function ActionScreen() {
  const params = useLocalSearchParams();
  const raw = Array.isArray(params.mission)
    ? params.mission[0]
    : params.mission;
  const mission = useMemo(() => parseMissionPayload(raw), [raw]);
  return mission ? (
    <TaskFlow key={mission.id} mission={mission} />
  ) : (
    <LoadFailure title="Open a task from Today" />
  );
}

function TaskFlow({ mission }: { mission: PersonalizedMission }) {
  const { theme } = useRiseAppearance();
  const insets = useSafeAreaInsets();
  const [record, setRecord] = useState<MissionRecord | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [note, setNote] = useState("");
  const [draftError, setDraftError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [details, setDetails] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [earned, setEarned] = useState(0);
  const [feedback, setFeedback] = useState<string>();
  const [feedbackBusy, setFeedbackBusy] = useState(false);
  const lock = useRef(false);
  const feedbackLock = useRef(false);
  useEffect(() => {
    let active = true;
    void missionRepository
      .get(mission.id)
      .then(async (saved) => {
        if (!active) return;
        const next =
          saved.status === "not_started"
            ? await missionRepository.patch(mission.id, {
                status: "in_progress",
                startedAt: saved.startedAt || new Date().toISOString(),
              })
            : saved;
        if (!active) return;
        setRecord(next);
        setNote(next.reflection || "");
        setFeedback(next.feedback?.difficulty);
        if (next.status !== "completed")
          void recordProgressEvent({
            clientEventId: `mission-started:${mission.id}`,
            eventType: "mission_started",
            skillSlug: mission.skillId,
            metadata: { day: mission.day, track: mission.track },
          }).catch(() => undefined);
      })
      .catch(() => {
        if (active) setLoadError(true);
      });
    return () => {
      active = false;
    };
  }, [mission.id, mission.day, mission.skillId, mission.track]);
  useEffect(() => {
    if (!record || record.status === "completed") return;
    const timer = setTimeout(() => {
      void missionRepository
        .patch(mission.id, { reflection: note })
        .then(() => setDraftError(false))
        .catch(() => setDraftError(true));
    }, 400);
    return () => clearTimeout(timer);
  }, [mission.id, note, record]);
  const done = new Set(
    (record?.completedSteps || []).filter(
      (index) => index >= 0 && index < mission.steps.length,
    ),
  );
  const current = mission.steps.findIndex((_, index) => !done.has(index));
  const ready = current === -1;
  const completed = record?.status === "completed";
  const saveStep = async (index: number, checked: boolean) => {
    if (lock.current || completed) return false;
    lock.current = true;
    setSaving(true);
    try {
      const next = Array.from(
        new Set(
          checked
            ? [...done, index]
            : Array.from(done).filter((item) => item !== index),
        ),
      ).sort((a, b) => a - b);
      const saved = await missionRepository.patch(mission.id, {
        completedSteps: next,
        chosenResult: record?.chosenResult || mission.title,
        status:
          next.length === mission.steps.length
            ? "proof_required"
            : "in_progress",
        reflection: note,
      });
      setRecord(saved);
      return true;
    } catch {
      Alert.alert(
        "That step wasn’t saved",
        "Your previous progress is still here. Try again.",
      );
      return false;
    } finally {
      lock.current = false;
      setSaving(false);
    }
  };
  const finish = async (stepsJustSaved = false) => {
    if (lock.current || (!ready && !stepsJustSaved) || completed) return;
    lock.current = true;
    setSaving(true);
    try {
      const result = await completeMission(mission.id, note);
      setEarned(result.xp);
      setRecord(await missionRepository.get(mission.id));
    } catch (error) {
      Alert.alert(
        "Couldn’t save your win",
        error instanceof Error
          ? error.message
          : "Your work is still here. Try again.",
      );
    } finally {
      lock.current = false;
      setSaving(false);
    }
  };
  const tune = async (value: "too_easy" | "right" | "too_hard") => {
    if (feedbackLock.current) return;
    feedbackLock.current = true;
    setFeedbackBusy(true);
    try {
      await updateProfile({
        lastDifficultyFeedback: value,
        lastBlocker: "none",
      });
      await missionRepository.patch(mission.id, {
        feedback: {
          ...record?.feedback,
          difficulty: value,
          submittedAt: new Date().toISOString(),
        },
      });
      setFeedback(value);
    } catch {
      Alert.alert(
        "Preference wasn’t saved",
        "Your task is complete. You can try this again later.",
      );
    } finally {
      feedbackLock.current = false;
      setFeedbackBusy(false);
    }
  };
  const openGuide = async () => {
    try {
      const url = mission.guideUrl || mission.resourceUrl;
      if (new URL(url).protocol !== "https:") throw new Error();
      await Linking.openURL(url);
    } catch {
      Alert.alert(
        "Guide could not be opened",
        "You can continue the task without opening the link.",
      );
    }
  };
  if (loadError)
    return <LoadFailure title="Your saved task could not be opened" />;
  if (!record) return <LoadPending />;
  if (completed)
    return (
      <ScrollView
        style={[styles.page, { backgroundColor: theme.background }]}
        contentContainerStyle={[
          styles.success,
          { paddingTop: 32, paddingBottom: insets.bottom + 32 },
        ]}
      >
        <View
          style={[styles.successOrb, { backgroundColor: theme.surfaceStrong }]}
        >
          <Text style={[styles.successCheck, { color: theme.accent }]}>✓</Text>
        </View>
        <Text style={[styles.eyebrow, { color: theme.accent }]}>
          {earned > 0 ? `SAVED · +${earned} XP` : "YOUR WIN IS SAVED"}
        </Text>
        <Text
          accessibilityRole="header"
          style={[styles.successTitle, { color: theme.text }]}
        >
          One small win.{"\n"}All yours.
        </Text>
        <Text style={[styles.successBody, { color: theme.muted }]}>
          {mission.title}
        </Text>
        {record.reflection ? (
          <View
            style={[
              styles.noteCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Text selectable style={[styles.body, { color: theme.text }]}>
              {record.reflection}
            </Text>
          </View>
        ) : null}
        <Text style={[styles.gentle, { color: theme.muted }]}>
          That’s enough for today. Your next task will be here when it opens.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace("/(tabs)/today" as never)}
          style={[styles.primary, { backgroundColor: theme.accent }]}
        >
          <Text style={[styles.primaryText, { color: theme.accentInk }]}>
            Back to Today
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/(tabs)/progress" as never)}
          style={styles.textButton}
        >
          <Text style={[styles.link, { color: theme.muted }]}>
            See my saved progress →
          </Text>
        </Pressable>
        <View style={[styles.tune, { borderColor: theme.border }]}>
          <Text style={[styles.tuneTitle, { color: theme.text }]}>
            Next time, I’d like…
          </Text>
          <Text style={[styles.small, { color: theme.muted }]}>
            Optional. One tap helps shape your next task.
          </Text>
          <View style={styles.feedbackRow}>
            {(
              [
                ["too_hard", "A smaller step"],
                ["right", "About the same"],
                ["too_easy", "More challenge"],
              ] as const
            ).map(([value, label]) => (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{
                  selected: feedback === value,
                  disabled: feedbackBusy,
                }}
                disabled={feedbackBusy}
                key={value}
                onPress={() => void tune(value)}
                style={[
                  styles.feedback,
                  {
                    backgroundColor:
                      feedback === value ? theme.accent : theme.surface,
                    borderColor:
                      feedback === value ? theme.accent : theme.border,
                  },
                ]}
              >
                <Text
                  style={{
                    color: feedback === value ? theme.accentInk : theme.text,
                    fontSize: 13,
                    fontWeight: "600",
                  }}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    );
  return (
    <KeyboardAvoidingView
      style={[styles.page, { backgroundColor: theme.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: 12 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.top}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close task and return to Today"
            disabled={saving}
            onPress={() => router.replace("/(tabs)/today" as never)}
            style={styles.back}
          >
            <Text style={{ color: theme.muted, fontSize: 15 }}>← Today</Text>
          </Pressable>
          <Text style={[styles.time, { color: theme.accent }]}>
            {mission.duration} min · your pace
          </Text>
        </View>
        <View
          style={styles.stepDots}
          accessibilityRole="progressbar"
          accessibilityLabel="Task steps"
          accessibilityValue={{
            min: 0,
            max: mission.steps.length,
            now: Math.min(done.size, mission.steps.length),
          }}
        >
          {mission.steps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.stepDot,
                {
                  backgroundColor: done.has(index)
                    ? theme.accent
                    : theme.border,
                },
              ]}
            />
          ))}
        </View>
        <Text style={[styles.eyebrow, { color: theme.muted }]}>
          {ready
            ? "THE LAST LITTLE STEP"
            : `STEP ${current + 1} OF ${mission.steps.length}`}
        </Text>
        <Text
          accessibilityRole="header"
          style={[styles.title, { color: theme.text }]}
        >
          {ready ? "Keep the win." : "Just this, for now."}
        </Text>
        <Text style={[styles.taskName, { color: theme.muted }]}>
          {mission.title}
        </Text>
        {ready ? (
          <View
            style={[
              styles.taskCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              Anything you want to remember?
            </Text>
            <Text style={[styles.small, { color: theme.muted }]}>
              A result, a lesson, or your next idea. You can leave this blank.
            </Text>
            <TextInput
              accessibilityLabel="Optional note about my task"
              value={note}
              onChangeText={setNote}
              editable={!saving}
              maxLength={1200}
              multiline
              placeholder="One thing I noticed… (optional)"
              placeholderTextColor={theme.muted}
              style={[
                styles.input,
                {
                  color: theme.text,
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                },
              ]}
            />
            {draftError ? (
              <Text
                accessibilityRole="alert"
                style={[styles.small, { color: theme.text }]}
              >
                Your note has not saved yet. Save my win will try again.
              </Text>
            ) : null}
            <Text style={[styles.small, { color: theme.muted }]}>
              By saving, you confirm you did the task. Progress is
              self-reported.
            </Text>
          </View>
        ) : (
          <View
            style={[
              styles.taskCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <View
              style={[
                styles.stepBadge,
                { backgroundColor: theme.surfaceStrong },
              ]}
            >
              <Text style={[styles.stepNumber, { color: theme.accent }]}>
                {current + 1}
              </Text>
            </View>
            <Text style={[styles.instruction, { color: theme.text }]}>
              {mission.steps[current]}
            </Text>
            <Text style={[styles.small, { color: theme.muted }]}>
              A rough first attempt counts. Use the finish line below to guide
              you.
            </Text>
          </View>
        )}
        {!ready ? (
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: showNote }}
              onPress={() => setShowNote((value) => !value)}
              style={styles.textButton}
            >
              <Text style={[styles.link, { color: theme.muted }]}>
                {showNote ? "Hide my note −" : "Add a note (optional) +"}
              </Text>
            </Pressable>
            {showNote ? (
              <TextInput
                accessibilityLabel="Optional task note"
                value={note}
                onChangeText={setNote}
                editable={!saving}
                multiline
                maxLength={1200}
                placeholder="One thing I noticed…"
                placeholderTextColor={theme.muted}
                style={[
                  styles.input,
                  {
                    color: theme.text,
                    borderColor: theme.border,
                    backgroundColor: theme.surface,
                  },
                ]}
              />
            ) : null}
          </>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: details }}
          onPress={() => setDetails((value) => !value)}
          style={styles.textButton}
        >
          <Text style={[styles.link, { color: theme.muted }]}>
            {details ? "Hide task details −" : "Finish line, help & safety +"}
          </Text>
        </Pressable>
        {details ? (
          <View style={[styles.details, { borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              What you’re aiming for
            </Text>
            <Text style={[styles.body, { color: theme.muted }]}>
              {mission.successCriteria}
            </Text>
            <Text style={[styles.body, { color: theme.muted }]}>
              {mission.ifStuck}
            </Text>
            <Text style={[styles.body, { color: theme.muted }]}>
              {mission.safetyNote}
            </Text>
            <Pressable
              accessibilityRole="link"
              onPress={() => void openGuide()}
              style={styles.textButton}
            >
              <Text style={[styles.link, { color: theme.accent }]}>
                {mission.guideLabel || "Open an optional learning search"} ↗
              </Text>
            </Pressable>
            {mission.steps.map((step, index) => (
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{
                  checked: done.has(index),
                  disabled: saving,
                }}
                disabled={saving}
                key={index}
                onPress={() => void saveStep(index, !done.has(index))}
                style={[styles.reviewStep, { borderColor: theme.border }]}
              >
                <Text style={{ color: theme.accent, fontSize: 17 }}>
                  {done.has(index) ? "✓" : "○"}
                </Text>
                <Text style={[styles.small, { color: theme.text, flex: 1 }]}>
                  {step}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        <Text style={[styles.safety, { color: theme.muted }]}>
          {mission.safetyNote}
        </Text>
        {ready || current === mission.steps.length - 1 ? (
          <Pressable
            accessibilityRole="button"
            disabled={saving}
            onPress={() =>
              void (async () => {
                if (!ready && !(await saveStep(current, true))) return;
                router.push({
                  pathname: "/proof",
                  params: {
                    missionId: mission.id,
                    task: mission.title,
                    goal: mission.goal,
                    skillId: mission.skillId,
                    reward: String(mission.reward),
                    coins: String(mission.coinReward),
                    duration: String(mission.duration),
                    missionContext: [
                      mission.title,
                      mission.focusSkill,
                      mission.successCriteria,
                    ].join(" "),
                  },
                } as never);
              })()
            }
            style={styles.textButton}
          >
            <Text style={[styles.link, { color: theme.muted }]}>
              I did this — add a photo or video (optional) →
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>
      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + 12,
            backgroundColor: theme.background,
            borderColor: theme.border,
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: saving, busy: saving }}
          disabled={saving}
          onPress={() =>
            void (async () => {
              if (ready) return finish();
              const saved = await saveStep(current, true);
              if (saved && current === mission.steps.length - 1)
                await finish(true);
            })()
          }
          style={({ pressed }) => [
            styles.primary,
            { backgroundColor: theme.accent, opacity: saving ? 0.5 : 1 },
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.primaryText, { color: theme.accentInk }]}>
            {saving
              ? "Saving…"
              : ready || current === mission.steps.length - 1
                ? "I did it — save my win  ✓"
                : "I did this step  →"}
          </Text>
        </Pressable>
        <Text
          style={[styles.small, { color: theme.muted, textAlign: "center" }]}
        >
          Save only after doing the step. No photo or written report required.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: {
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
    padding: 24,
    paddingBottom: 24,
  },
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  back: { minHeight: 44, justifyContent: "center" },
  time: { fontSize: 12, fontWeight: "700" },
  stepDots: { flexDirection: "row", gap: 7, marginTop: 22, marginBottom: 26 },
  stepDot: { height: 4, borderRadius: 3, flex: 1 },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: "800",
    marginBottom: 12,
  },
  title: { fontSize: 37, lineHeight: 44, fontWeight: "800", letterSpacing: -1 },
  taskName: { fontSize: 15, lineHeight: 23, marginTop: 10, marginBottom: 22 },
  taskCard: { borderWidth: 1, borderRadius: 25, padding: 23 },
  stepBadge: {
    height: 42,
    width: 42,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  stepNumber: { fontSize: 20, fontWeight: "800" },
  instruction: { fontSize: 19, lineHeight: 29, fontWeight: "600" },
  small: { fontSize: 13, lineHeight: 20, marginTop: 10 },
  cardTitle: { fontSize: 19, lineHeight: 26, fontWeight: "700" },
  input: {
    minHeight: 110,
    borderWidth: 1,
    borderRadius: 15,
    padding: 15,
    fontSize: 17,
    lineHeight: 25,
    textAlignVertical: "top",
    marginTop: 16,
  },
  textButton: {
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
  },
  link: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 21,
    textAlign: "center",
  },
  body: { fontSize: 15, lineHeight: 24, marginTop: 12 },
  details: { borderWidth: 1, borderRadius: 20, padding: 18, marginBottom: 16 },
  reviewStep: {
    flexDirection: "row",
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: 12,
    alignItems: "center",
  },
  safety: { fontSize: 12, lineHeight: 19, marginTop: 10 },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  primary: {
    minHeight: 58,
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: { fontSize: 18, fontWeight: "800", textAlign: "center" },
  pressed: { opacity: 0.8, transform: [{ scale: 0.985 }] },
  success: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    paddingHorizontal: 28,
    flexGrow: 1,
    justifyContent: "center",
  },
  successOrb: {
    height: 104,
    width: 104,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },
  successCheck: { fontSize: 48, fontWeight: "600" },
  successTitle: {
    fontSize: 42,
    lineHeight: 48,
    fontWeight: "800",
    letterSpacing: -1.3,
  },
  successBody: { fontSize: 17, lineHeight: 26, marginTop: 16 },
  gentle: { fontSize: 15, lineHeight: 24, marginTop: 18, marginBottom: 24 },
  noteCard: { borderWidth: 1, borderRadius: 18, padding: 18, marginTop: 20 },
  tune: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 23,
    marginTop: 28,
  },
  tuneTitle: { fontSize: 17, fontWeight: "700" },
  feedbackRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },
  feedback: {
    minHeight: 44,
    paddingHorizontal: 13,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 14,
  },
});
