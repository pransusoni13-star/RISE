import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { RiseButton, RiseCard, RiseEyebrow } from "../../components/rise-ui";
import { getCurrentUser, RiseUser } from "../../services/auth";
import { getAvailableMissionDay } from "../../services/dayUnlock";
import {
  missionRepository,
  MissionRecord,
} from "../../services/missionRepository";
import {
  createSevenDayPlan,
  loadProfile,
  updateProfile,
  RiseProfile,
} from "../../services/personalization";
import { useRiseAppearance } from "../../services/appearance";
import {
  canStartNextCycle,
  nextPracticeCycle,
} from "../../services/practiceCycle";

export default function TodayTabScreen() {
  const { theme } = useRiseAppearance();
  const [profile, setProfile] = useState<RiseProfile | null>(null);
  const [user, setUser] = useState<RiseUser | null>(null);
  const [records, setRecords] = useState<Record<string, MissionRecord>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [renewing, setRenewing] = useState(false);
  const [renewError, setRenewError] = useState("");
  const renewLock = useRef(false);

  useFocusEffect(
    useCallback(() => {
      // A changed key represents an explicit retry and intentionally restarts this load.
      void reloadKey;
      let active = true;
      setLoadError("");
      void Promise.all([
        loadProfile(),
        getCurrentUser().catch(() => null),
        missionRepository.list(),
      ])
        .then(([storedProfile, storedUser, storedRecords]) => {
          if (!active) return;
          setProfile(storedProfile);
          setUser(storedUser);
          setRecords(
            Object.fromEntries(
              storedRecords.map((record) => [record.missionId, record]),
            ),
          );
        })
        .catch(() => {
          if (active)
            setLoadError(
              "RISE could not open your saved mission. Your progress has not been changed.",
            );
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [reloadKey]),
  );

  const plan = useMemo(
    () => (profile ? createSevenDayPlan(profile) : []),
    [profile],
  );
  const completedDays = useMemo(
    () =>
      plan
        .filter((mission) => records[mission.id]?.status === "completed")
        .map((mission) => mission.day),
    [plan, records],
  );
  const availableDay = getAvailableMissionDay(
    profile?.skillStartDate,
    plan.length || 1,
    completedDays,
  );
  const todayMission = plan[availableDay - 1] || plan[0];
  const todayRecord = todayMission ? records[todayMission.id] : undefined;
  const todayComplete = todayRecord?.status === "completed";
  const missionStage = todayComplete
    ? 3
    : todayRecord?.status === "proof_required" ||
        todayRecord?.status === "proof_submitted"
      ? 2
      : todayRecord?.status === "in_progress"
        ? 1
        : 0;
  const hasStarted = missionStage > 0;
  const firstName = user?.display_name.trim().split(/\s+/)[0];
  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? "Good morning"
      : hour < 17
        ? "Good afternoon"
        : hour < 21
          ? "Good evening"
          : "Good night";
  const missionSummary = (
    todayMission?.description || "Your next focused step is ready."
  ).split(/(?<=[.!?])\s+/)[0];
  const cycleProgress = plan.length
    ? Math.round((completedDays.length / plan.length) * 100)
    : 0;
  const cycleComplete = plan.length > 0 && completedDays.length === plan.length;
  const lastCompletedAt = records[plan[plan.length - 1]?.id]?.completedAt;
  const canRenew = cycleComplete && canStartNextCycle(lastCompletedAt);

  const renewCycle = async () => {
    if (renewLock.current || !profile || !canRenew) return;
    renewLock.current = true;
    setRenewing(true);
    setRenewError("");
    try {
      const current = await loadProfile();
      if (current.skillStartDate !== profile.skillStartDate)
        throw new Error("Your plan changed. Reopen Today to continue.");
      setProfile(
        await updateProfile(nextPracticeCycle(current, lastCompletedAt)),
      );
    } catch (error) {
      setRenewError(
        error instanceof Error
          ? error.message
          : "Your saved week is safe. Try again.",
      );
    } finally {
      renewLock.current = false;
      setRenewing(false);
    }
  };

  const openCycleQuiz = () => {
    const finalMission = plan[plan.length - 1];
    if (!finalMission || !profile) return;
    router.push({
      pathname: "/quiz",
      params: {
        cycleGate: "1",
        cycleId: finalMission.id,
        skillId: profile.weeklySkill || finalMission.skillId,
        goal: profile.selectedGoals[0] || finalMission.goal,
        goals: JSON.stringify(profile.selectedGoals),
        commitment: profile.commitment || "Every 7 days",
        focusSkill: finalMission.focusSkill,
        missionTitle: finalMission.title,
        missionSteps: JSON.stringify(finalMission.steps),
        successCriteria: finalMission.successCriteria,
        reflectionPrompt: finalMission.reflectionPrompt || "",
      },
    } as any);
  };

  if (loading) {
    return (
      <View style={[styles.statePage, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.accent} />
        <Text style={[styles.stateText, { color: theme.muted }]}>
          Opening today’s mission…
        </Text>
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={[styles.statePage, { backgroundColor: theme.background }]}>
        <Text style={[styles.stateTitle, { color: theme.text }]}>
          Your mission is still safe.
        </Text>
        <Text style={[styles.stateText, { color: theme.muted }]}>
          {loadError}
        </Text>
        <View style={styles.stateAction}>
          <RiseButton
            label="Try again"
            onPress={() => {
              setLoading(true);
              setReloadKey((value) => value + 1);
            }}
          />
        </View>
      </View>
    );
  }

  if (!profile || !todayMission) {
    return (
      <View style={[styles.statePage, { backgroundColor: theme.background }]}>
        <Text style={[styles.stateTitle, { color: theme.text }]}>
          Choose your first direction.
        </Text>
        <Text style={[styles.stateText, { color: theme.muted }]}>
          RISE needs one goal before it can build today’s focused mission.
        </Text>
        <View style={styles.stateAction}>
          <RiseButton
            label="Choose my first task"
            onPress={() => router.replace("/quick-start" as never)}
          />
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.page, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.greeting, { color: theme.muted }]}>
        {greeting}
        {firstName ? `, ${firstName}` : ""}.
      </Text>
      <Text
        accessibilityRole="header"
        style={[styles.heading, { color: theme.text }]}
      >
        {todayComplete
          ? "A little progress.\nA good place to pause."
          : "One small thing.\nYou’ve got room for this."}
      </Text>
      <RiseCard style={styles.missionCard}>
        <View style={styles.cardTop}>
          <RiseEyebrow>
            {todayComplete ? "SAVED FOR YOU" : "YOUR ONE THING"}
          </RiseEyebrow>
          <View
            style={[styles.timePill, { backgroundColor: theme.surfaceStrong }]}
          >
            <Text style={[styles.timeText, { color: theme.accent }]}>
              {todayComplete ? "✓ Done" : `${todayMission?.duration || 5} min`}
            </Text>
          </View>
        </View>
        <View
          style={[styles.taskMark, { backgroundColor: theme.surfaceStrong }]}
        >
          <Text style={[styles.taskGlyph, { color: theme.accent }]}>
            {todayComplete ? "✓" : "↗"}
          </Text>
        </View>
        <Text style={[styles.missionTitle, { color: theme.text }]}>
          {todayMission?.title || "Try one small practice task"}
        </Text>
        <Text
          style={[styles.missionSummary, { color: theme.muted }]}
          numberOfLines={3}
        >
          {todayComplete
            ? todayRecord?.proof?.description ||
              "Your task is saved on this device."
            : missionSummary}
        </Text>
        <View style={styles.primaryAction}>
          <RiseButton
            label={
              renewing
                ? "Opening your next week…"
                : cycleComplete
                  ? canRenew
                    ? "Start a fresh week  ↗"
                    : "See this week’s wins"
                  : todayComplete
                    ? "See my saved win"
                    : hasStarted
                      ? "Pick up where I left off"
                      : "Let’s do this  ↗"
            }
            disabled={renewing}
            onPress={() =>
              cycleComplete
                ? canRenew
                  ? void renewCycle()
                  : router.push("/(tabs)/progress" as never)
                : router.push({
                    pathname: "/action",
                    params: todayMission
                      ? { mission: JSON.stringify(todayMission) }
                      : {},
                  } as any)
            }
          />
        </View>
        {renewError ? (
          <Text
            accessibilityRole="alert"
            style={[styles.progressNote, { color: theme.text }]}
          >
            {renewError}
          </Text>
        ) : null}
        <Text style={[styles.progressNote, { color: theme.muted }]}>
          {cycleComplete
            ? canRenew
              ? "Same goal. One fresh step at a time."
              : "Your next week opens tomorrow. No setup needed."
            : todayComplete
              ? "That’s enough for today."
              : hasStarted
                ? "Your last step is saved. Start from there."
                : "One step at a time. Notes and photos are optional."}
        </Text>
        {cycleComplete ? (
          <View style={styles.primaryAction}>
            <RiseButton
              variant="secondary"
              label="Review with an optional quiz"
              onPress={openCycleQuiz}
              disabled={renewing}
            />
          </View>
        ) : null}
      </RiseCard>
      <View style={styles.cycleHeader}>
        <Text style={[styles.cycleTitle, { color: theme.text }]}>
          {plan.length === 7 ? "Your week" : "Your practice cycle"}
        </Text>
        <Text style={[styles.cycleLabel, { color: theme.muted }]}>
          {completedDays.length} / {plan.length} tasks
        </Text>
      </View>
      <View
        accessibilityRole="progressbar"
        accessibilityLabel="Tasks saved this cycle"
        accessibilityValue={{
          min: 0,
          max: plan.length,
          now: completedDays.length,
        }}
        style={[styles.cycleTrack, { backgroundColor: theme.surfaceStrong }]}
      >
        <View
          style={[
            styles.cycleFill,
            { backgroundColor: theme.accent, width: `${cycleProgress}%` },
          ]}
        />
      </View>
      <Text style={[styles.cycleHelp, { color: theme.muted }]}>
        {completedDays.length
          ? `${completedDays.length} small win${completedDays.length === 1 ? "" : "s"} saved. Progress you can come back to.`
          : "Your first small win starts here."}
      </Text>
      {todayComplete && !cycleComplete && plan[availableDay] ? (
        <View
          style={[
            styles.tomorrow,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.tomorrowLabel, { color: theme.accent }]}>
            A PEEK AT TOMORROW
          </Text>
          <Text style={[styles.tomorrowTitle, { color: theme.text }]}>
            {plan[availableDay].title}
          </Text>
          <Text style={[styles.cycleHelp, { color: theme.muted }]}>
            No need to do it now. It will be ready after the daily wait.
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: {
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
    padding: 24,
    paddingTop: 22,
    paddingBottom: 110,
  },
  statePage: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 28,
  },
  stateTitle: {
    fontSize: 25,
    lineHeight: 32,
    fontWeight: "800",
    textAlign: "center",
  },
  stateText: {
    fontSize: 15,
    lineHeight: 23,
    textAlign: "center",
    marginTop: 12,
  },
  stateAction: { width: "100%", marginTop: 22 },
  greeting: { fontSize: 14, lineHeight: 21 },
  heading: {
    fontSize: 31,
    lineHeight: 38,
    fontWeight: "800",
    letterSpacing: -0.8,
    marginTop: 9,
    marginBottom: 26,
  },
  missionCard: { padding: 23, borderRadius: 26 },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  timePill: { paddingHorizontal: 11, paddingVertical: 7, borderRadius: 20 },
  timeText: { fontSize: 12, fontWeight: "700" },
  taskMark: {
    height: 58,
    width: 58,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 26,
    marginBottom: 20,
  },
  taskGlyph: { fontSize: 30, fontWeight: "500" },
  missionTitle: {
    fontSize: 29,
    lineHeight: 36,
    fontWeight: "700",
    letterSpacing: -0.7,
  },
  missionSummary: { fontSize: 16, lineHeight: 25, marginTop: 14 },
  primaryAction: { marginTop: 25 },
  progressNote: {
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 12,
  },
  cycleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 27,
    marginBottom: 13,
  },
  cycleTitle: { fontSize: 17, fontWeight: "700" },
  cycleLabel: { fontSize: 12 },
  cycleTrack: { height: 7, borderRadius: 8, overflow: "hidden" },
  cycleFill: { height: "100%", borderRadius: 8 },
  cycleHelp: { fontSize: 13, lineHeight: 20, marginTop: 10 },
  tomorrow: { padding: 20, borderRadius: 20, borderWidth: 1, marginTop: 26 },
  tomorrowLabel: { fontSize: 9, fontWeight: "800", letterSpacing: 1.2 },
  tomorrowTitle: {
    fontSize: 18,
    lineHeight: 25,
    fontWeight: "700",
    marginTop: 10,
  },
});
