import React, { useMemo, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { AppPageHeader } from "../components/appPageHeader";
import { CycleQuestion, getCycleQuestions, getQuizRank, QuizLearningContext } from "../services/cycleQuiz";
import { RISEProgress, addSkillXP, addXP, getNextRecommendation } from "../services/progressEngine";
import { progressRepository } from "../services/progressRepository";
import { createSevenDayPlan, loadProfile, updateProfile } from "../services/personalization";
import { missionRepository } from "../services/missionRepository";
import { recordProgressEvent } from "../services/auth";
import { useRiseAppearance } from "../services/appearance";

type QuizResult = {
  score: number;
  percentage: number;
  earnedXP: number;
  skillId: string;
  goal: string;
  passed: boolean;
  badge?: string;
  answers: number[];
};

type Recommendation = {
  title: string;
  description: string;
  skillId: string | null;
  why?: string;
  difficulty?: "Easy" | "Medium" | "Hard" | "Insane";
  type?: "learning" | "quiz" | "mission" | "project" | "review";
};

const PRACTICE_REWARD = 25;

const routeString = (value: string | string[] | undefined, fallback = "") =>
  typeof value === "string" && value.trim() ? value.trim() : fallback;

const parseSteps = (value: string | string[] | undefined): string[] => {
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((step): step is string => typeof step === "string").slice(0, 6)
      : [];
  } catch {
    return [];
  }
};

const displayName = (value: string) => value.replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function QuizScreen() {
  const { theme } = useRiseAppearance();
  const params = useLocalSearchParams();
  const cycleGate = params.cycleGate === "1";
  const cycleId = routeString(params.cycleId, "current-cycle");
  const skillId = routeString(params.skillId, "foundations");
  const primaryGoal = routeString(params.goal, "personal");
  const selectedGoals = routeString(params.goals, JSON.stringify([primaryGoal]));
  const time = routeString(params.time);
  const accountability = routeString(params.accountability);
  const commitment = routeString(params.commitment);

  const learningContext = useMemo<QuizLearningContext>(() => ({
    focusSkill: routeString(params.focusSkill, displayName(skillId)),
    missionTitle: routeString(params.missionTitle, routeString(params.task)),
    missionSteps: parseSteps(params.missionSteps),
    successCriteria: routeString(params.successCriteria),
    reflectionPrompt: routeString(params.reflectionPrompt),
  }), [params.focusSkill, params.missionSteps, params.missionTitle, params.reflectionPrompt, params.successCriteria, params.task, skillId]);

  const questions = useMemo<CycleQuestion[]>(
    () => getCycleQuestions(primaryGoal, `${primaryGoal} ${selectedGoals}`, learningContext),
    [learningContext, primaryGoal, selectedGoals],
  );

  const submitting = useRef(false);
  const attemptId = useRef(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);

  const questionItem = questions[currentQuestion];
  const requiredCorrect = Math.ceil(questions.length * 0.8);

  const handleAnswer = (index: number) => {
    if (selectedAnswer !== null || saving) return;
    setSelectedAnswer(index);
    setAnswers((current) => {
      const next = [...current];
      next[currentQuestion] = index;
      return next;
    });
  };

  const finishQuiz = async () => {
    if (submitting.current || selectedAnswer === null) return;
    submitting.current = true;
    if (!attemptId.current) attemptId.current = Date.now();
    setSaving(true);

    const finalAnswers = [...answers];
    finalAnswers[currentQuestion] = selectedAnswer;
    const finalScore = score + (selectedAnswer === questionItem.answer ? 1 : 0);
    const percentage = Math.round((finalScore / questions.length) * 100);
    const passed = !cycleGate || percentage >= 80;
    const earnedXP = cycleGate ? (passed ? 100 : 0) : Math.round(PRACTICE_REWARD * (percentage / 100));
    const earnedCoins = earnedXP > 0 ? Math.max(5, Math.round(earnedXP / 5)) : 0;
    const masteryRank = getQuizRank(percentage);

    try {
      if (cycleGate) {
        const profile = await loadProfile();
        const plan = createSevenDayPlan(profile);
        const records = await missionRepository.list();
        const complete = plan.length > 0
          && cycleId === plan[plan.length - 1].id
          && plan.every((mission) => records.some((record) => record.missionId === mission.id && record.status === "completed"));
        if (!complete) {
          Alert.alert("Finish your cycle first", "Complete each mission and its proof review before taking the final rank trial.");
          return;
        }
      }

      let progress: RISEProgress = await progressRepository.load();
      const source = cycleGate ? `cycle-quiz:${cycleId}` : `practice-quiz:${primaryGoal}:${skillId}`;
      const alreadyRewarded = progress.events.some((event) => event.type === "quiz" && event.metadata?.source === source && event.amount > 0);

      if (!alreadyRewarded && (!cycleGate || passed)) {
        progress = addXP(progress, earnedXP, "quiz", cycleGate ? `Rank trial passed — ${percentage}%` : `Mastery check — ${percentage}%`, cycleGate ? 50 : earnedCoins, {
          skillId,
          goal: primaryGoal,
          score: percentage,
          difficulty: "Rank Trial",
          source,
          passed,
          rank: masteryRank.name,
        });
        progress = addSkillXP(progress, skillId, earnedXP, primaryGoal);
      } else {
        progress = addXP(progress, 0, "quiz", `Mastery review — ${percentage}%`, 0, {
          skillId,
          goal: primaryGoal,
          score: percentage,
          difficulty: "Rank Trial",
          source,
          passed,
          rank: masteryRank.name,
        });
      }

      const earnedBadge = cycleGate && passed ? `${displayName(skillId)} ${masteryRank.name}` : undefined;
      const badge = alreadyRewarded ? undefined : earnedBadge;
      const nextRecommendation = getNextRecommendation(progress, primaryGoal) as Recommendation;

      await progressRepository.save(progress);
      if (earnedBadge) {
        const profile = await loadProfile();
        await updateProfile({ cycleBadges: Array.from(new Set([...(profile.cycleBadges || []), earnedBadge])) });
      }
      await recordProgressEvent({
        clientEventId: `quiz:${attemptId.current}`,
        eventType: "quiz_completed",
        skillSlug: skillId.trim().toLowerCase().replace(/\s+/g, "-"),
        value: percentage,
        metadata: { goal: primaryGoal, passed, cycleGate, difficulty: "Rank Trial", rank: masteryRank.name },
      }).catch(() => undefined);

      setQuizResult({
        score: finalScore,
        percentage,
        earnedXP: alreadyRewarded ? 0 : earnedXP,
        skillId,
        goal: primaryGoal,
        passed,
        badge,
        answers: finalAnswers,
      });
      setRecommendation(nextRecommendation);
      setFinished(true);
    } catch (error) {
      Alert.alert("Couldn’t save your trial", "Your answers are still here. Please try saving again.");
      console.warn("Quiz progress save failed", error);
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  };

  const nextQuestion = () => {
    if (selectedAnswer === null || saving) return;
    if (currentQuestion === questions.length - 1) {
      void finishQuiz();
      return;
    }
    if (selectedAnswer === questionItem.answer) setScore((current) => current + 1);
    setCurrentQuestion((current) => current + 1);
    setSelectedAnswer(null);
  };

  const resetTrial = () => {
    attemptId.current = Date.now();
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setAnswers([]);
    setScore(0);
    setFinished(false);
    setQuizResult(null);
  };

  if (finished && quizResult) {
    const rank = getQuizRank(quizResult.percentage);
    const missed = questions.map((item, index) => ({ item, answer: quizResult.answers[index] })).filter(({ item, answer }) => answer !== item.answer);
    const nextSkill = recommendation?.skillId ?? quizResult.skillId;
    const nextDifficulty = recommendation?.difficulty ?? "Practice";

    return (
      <ScrollView style={[styles.page, { backgroundColor: theme.background }]} contentContainerStyle={styles.resultContent} showsVerticalScrollIndicator={false}>
        <AppPageHeader />
        <Text style={[styles.eyebrow, { color: theme.accent }]}>RANK TRIAL COMPLETE</Text>
        <Text style={[styles.resultTitle, { color: theme.text }]}>{rank.name}</Text>
        <Text style={[styles.resultSubtitle, { color: theme.muted }]}>{quizResult.score} of {questions.length} mastered · {quizResult.percentage}%</Text>

        <View style={[styles.rankCard, { backgroundColor: theme.surface, borderColor: quizResult.passed ? theme.accent : theme.border }]}>
          <View style={[styles.rankMark, { borderColor: theme.accent }]}><Text style={[styles.rankMarkText, { color: theme.accent }]}>{rank.name.slice(0, 1)}</Text></View>
          <View style={styles.rankBody}>
            <Text style={[styles.rankLabel, { color: theme.accent }]}>{quizResult.passed ? "TRIAL CLEARED" : "TRAIN, THEN RETURN"}</Text>
            <Text style={[styles.rankName, { color: theme.text }]}>{rank.name} rank</Text>
            <Text style={[styles.rankHelp, { color: theme.muted }]}>{rank.nextName ? `${Math.max(0, (rank.nextMinimum || 100) - quizResult.percentage)} points to ${rank.nextName}` : "Every answer mastered"}</Text>
          </View>
        </View>

        <View style={[styles.rankTrack, { backgroundColor: theme.surfaceStrong }]}><View style={[styles.rankFill, { backgroundColor: theme.accent, width: `${quizResult.percentage}%` as `${number}%` }]} /></View>
        <Text style={[styles.rewardText, { color: theme.text }]}>{quizResult.passed ? quizResult.earnedXP > 0 ? `+${quizResult.earnedXP} XP earned` : "Mastery saved · reward already claimed" : `${requiredCorrect} correct answers are needed to unlock the next cycle`}</Text>

        {quizResult.badge ? <View style={[styles.badgeCard, { backgroundColor: theme.surfaceStrong }]}><Text style={[styles.eyebrow, { color: theme.accent }]}>NEW RISE BADGE</Text><Text style={[styles.badgeTitle, { color: theme.text }]}>{quizResult.badge}</Text></View> : null}

        <Text style={[styles.sectionTitle, { color: theme.text }]}>{missed.length ? "Turn misses into mastery" : "Clean run"}</Text>
        <Text style={[styles.sectionHelp, { color: theme.muted }]}>{missed.length ? "Review the exact idea behind every missed answer." : "You explained and applied every idea in this trial."}</Text>
        {missed.map(({ item, answer }, index) => (
          <View key={item.question} style={[styles.reviewCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.reviewNumber, { color: theme.accent }]}>REVIEW {index + 1}</Text>
            <Text style={[styles.reviewQuestion, { color: theme.text }]}>{item.question}</Text>
            <Text style={[styles.reviewAnswer, { color: theme.muted }]}>Your answer: {typeof answer === "number" ? item.options[answer] : "No answer"}</Text>
            <Text style={[styles.reviewCorrect, { color: theme.text }]}>Best answer: {item.options[item.answer]}</Text>
            <Text style={[styles.reviewWhy, { color: theme.muted }]}>{item.explanation}</Text>
          </View>
        ))}

        <View style={[styles.nextCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.eyebrow, { color: theme.accent }]}>NEXT TRAINING MOVE</Text>
          <Text style={[styles.nextTitle, { color: theme.text }]}>{recommendation?.title ?? "Apply what you learned"}</Text>
          <Text style={[styles.nextText, { color: theme.muted }]}>{recommendation?.description ?? "Use the review above in one focused attempt."}</Text>
        </View>

        <Pressable accessibilityRole="button" style={({ pressed }) => [styles.primaryButton, { backgroundColor: theme.accent }, pressed && styles.pressed]} onPress={async () => {
          if (cycleGate && !quizResult.passed) return resetTrial();
          if (cycleGate) {
            const profile = await loadProfile();
            const goals = profile.selectedGoals.length ? profile.selectedGoals : [primaryGoal, "personal"];
            router.replace({ pathname: "/focus", params: { goal: goals[0], secondaryGoal: goals[1] || "personal", goals: JSON.stringify(goals), customGoal: profile.customGoal } } as any);
            return;
          }
          router.push({ pathname: "/action", params: { skillId: nextSkill, goal: primaryGoal, goals: selectedGoals, time, accountability, commitment, difficulty: nextDifficulty } } as any);
        }}><Text style={[styles.primaryButtonText, { color: theme.accentInk }]}>{cycleGate && !quizResult.passed ? "Train again" : cycleGate ? "Choose my next skills" : "Use this in my next mission"}</Text></Pressable>

        {!cycleGate && missed.length ? <Pressable accessibilityRole="button" style={({ pressed }) => [styles.secondaryButton, { borderColor: theme.border }, pressed && styles.pressed]} onPress={resetTrial}><Text style={[styles.secondaryButtonText, { color: theme.text }]}>Retry the rank trial</Text></Pressable> : null}
        <Pressable accessibilityRole="button" style={({ pressed }) => [styles.textButton, pressed && styles.pressed]} onPress={() => router.push({ pathname: "/progress-screen", params: { goal: primaryGoal, goals: selectedGoals } } as any)}><Text style={[styles.textButtonText, { color: theme.accent }]}>View my progress</Text></Pressable>
      </ScrollView>
    );
  }

  const isCorrect = selectedAnswer === questionItem.answer;
  const liveScore = score + (selectedAnswer !== null && isCorrect ? 1 : 0);
  const progress = ((currentQuestion + (selectedAnswer !== null ? 1 : 0)) / questions.length) * 100;

  return (
    <ScrollView style={[styles.page, { backgroundColor: theme.background }]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <AppPageHeader />
      <Text style={[styles.eyebrow, { color: theme.accent }]}>{cycleGate ? "FINAL RANK TRIAL" : "MASTERY CHECK"}</Text>
      <Text style={[styles.title, { color: theme.text }]}>Earn your next rank.</Text>
      <Text style={[styles.subtitle, { color: theme.muted }]}>Answer from the work you learned. Every answer includes the reason, so a miss still makes you stronger.</Text>

      <View style={styles.statusRow}>
        <View style={[styles.skillPill, { backgroundColor: theme.surfaceStrong }]}><Text style={[styles.skillPillText, { color: theme.text }]} numberOfLines={1}>{displayName(learningContext.focusSkill || skillId)}</Text></View>
        <Text style={[styles.scoreNow, { color: theme.muted }]}>{liveScore} mastered</Text>
      </View>
      <View style={[styles.progressTrack, { backgroundColor: theme.surfaceStrong }]}><View style={[styles.progressFill, { backgroundColor: theme.accent, width: `${progress}%` as `${number}%` }]} /></View>
      <View style={styles.progressLabels}><Text style={[styles.progressText, { color: theme.muted }]}>MOVE {currentQuestion + 1} OF {questions.length}</Text><Text style={[styles.progressText, { color: theme.muted }]}>{cycleGate ? `${requiredCorrect}/${questions.length} TO CLEAR` : "LEARN · APPLY · PROVE"}</Text></View>

      <View style={[styles.questionCard, { backgroundColor: theme.surface, borderColor: selectedAnswer === null ? theme.border : isCorrect ? theme.accent : theme.border }]}>
        <Text style={[styles.focusLabel, { color: theme.accent }]}>{questionItem.focus.toUpperCase()}</Text>
        <Text style={[styles.question, { color: theme.text }]}>{questionItem.question}</Text>
        <View style={styles.options}>
          {questionItem.options.map((option, index) => {
            const selected = selectedAnswer === index;
            const correct = index === questionItem.answer;
            const revealed = selectedAnswer !== null;
            return (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ checked: selected, disabled: revealed || saving }}
                key={`${index}-${option}`}
                onPress={() => handleAnswer(index)}
                disabled={revealed || saving}
                style={({ pressed }) => [
                  styles.option,
                  { backgroundColor: theme.background, borderColor: theme.border },
                  revealed && correct && { backgroundColor: theme.surfaceStrong, borderColor: theme.accent },
                  revealed && selected && !correct && styles.wrongOption,
                  pressed && styles.pressed,
                ]}
              >
                <View style={[styles.optionKey, { borderColor: revealed && correct ? theme.accent : theme.border }]}><Text style={[styles.optionKeyText, { color: revealed && correct ? theme.accent : theme.muted }]}>{String.fromCharCode(65 + index)}</Text></View>
                <Text style={[styles.optionText, { color: revealed && correct ? theme.text : theme.muted }, selected && { color: theme.text }]}>{option}</Text>
              </Pressable>
            );
          })}
        </View>

        {selectedAnswer !== null ? (
          <View accessibilityRole="alert" style={[styles.coachNote, { backgroundColor: theme.surfaceStrong, borderColor: isCorrect ? theme.accent : theme.border }]}>
            <Text style={[styles.coachLabel, { color: isCorrect ? theme.accent : theme.text }]}>{isCorrect ? "MASTERED" : "TRAINING NOTE"}</Text>
            {!isCorrect ? <Text style={[styles.correctLine, { color: theme.text }]}>Best answer: {questionItem.options[questionItem.answer]}</Text> : null}
            <Text style={[styles.coachText, { color: theme.muted }]}>{questionItem.explanation}</Text>
          </View>
        ) : null}
      </View>

      {selectedAnswer !== null ? <Pressable accessibilityRole="button" accessibilityState={{ disabled: saving }} disabled={saving} style={({ pressed }) => [styles.primaryButton, { backgroundColor: theme.accent }, pressed && styles.pressed, saving && styles.disabled]} onPress={nextQuestion}><Text style={[styles.primaryButtonText, { color: theme.accentInk }]}>{saving ? "Saving trial…" : currentQuestion === questions.length - 1 ? "Reveal my rank" : "Next move"}</Text></Pressable> : <Text style={[styles.chooseHint, { color: theme.muted }]}>Choose the strongest answer to continue.</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { padding: 22, paddingTop: 58, paddingBottom: 80 },
  resultContent: { padding: 22, paddingTop: 58, paddingBottom: 80 },
  eyebrow: { fontSize: 10, fontWeight: "900", letterSpacing: 1.5 },
  title: { fontSize: 35, lineHeight: 41, fontWeight: "900", letterSpacing: -1, marginTop: 8 },
  subtitle: { fontSize: 15, lineHeight: 22, marginTop: 9, marginBottom: 24 },
  statusRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  skillPill: { flexShrink: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  skillPillText: { fontSize: 11, fontWeight: "900", letterSpacing: .4 },
  scoreNow: { fontSize: 11, fontWeight: "800" },
  progressTrack: { height: 5, borderRadius: 999, overflow: "hidden", marginTop: 14 },
  progressFill: { height: "100%", borderRadius: 999 },
  progressLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: 8, marginBottom: 20 },
  progressText: { fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  questionCard: { borderRadius: 22, borderWidth: 1, padding: 19 },
  focusLabel: { fontSize: 10, fontWeight: "900", letterSpacing: 1.4, marginBottom: 10 },
  question: { fontSize: 22, lineHeight: 29, fontWeight: "800", letterSpacing: -.25 },
  options: { marginTop: 20, gap: 9 },
  option: { minHeight: 58, borderRadius: 14, borderWidth: 1, padding: 12, flexDirection: "row", alignItems: "center", gap: 11 },
  wrongOption: { backgroundColor: "rgba(196, 72, 72, .10)", borderColor: "#B95B5B" },
  optionKey: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  optionKeyText: { fontSize: 11, fontWeight: "900" },
  optionText: { flex: 1, fontSize: 14, lineHeight: 20, fontWeight: "600" },
  coachNote: { borderWidth: 1, borderRadius: 14, padding: 14, marginTop: 15 },
  coachLabel: { fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  correctLine: { fontSize: 13, lineHeight: 19, fontWeight: "800", marginTop: 8 },
  coachText: { fontSize: 13, lineHeight: 20, marginTop: 6 },
  primaryButton: { minHeight: 55, borderRadius: 15, alignItems: "center", justifyContent: "center", paddingHorizontal: 18, marginTop: 18 },
  primaryButtonText: { fontSize: 14, fontWeight: "900" },
  secondaryButton: { minHeight: 52, borderRadius: 15, borderWidth: 1, alignItems: "center", justifyContent: "center", marginTop: 10 },
  secondaryButtonText: { fontSize: 13, fontWeight: "800" },
  textButton: { minHeight: 48, alignItems: "center", justifyContent: "center", marginTop: 4 },
  textButtonText: { fontSize: 13, fontWeight: "800" },
  chooseHint: { textAlign: "center", fontSize: 12, marginTop: 16 },
  resultTitle: { fontSize: 42, lineHeight: 48, fontWeight: "900", letterSpacing: -1.2, marginTop: 7 },
  resultSubtitle: { fontSize: 14, marginTop: 5, marginBottom: 20 },
  rankCard: { borderRadius: 22, borderWidth: 1, padding: 18, flexDirection: "row", alignItems: "center", gap: 15 },
  rankMark: { width: 62, height: 62, borderRadius: 18, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  rankMarkText: { fontSize: 28, fontWeight: "900" },
  rankBody: { flex: 1 },
  rankLabel: { fontSize: 9, fontWeight: "900", letterSpacing: 1.2 },
  rankName: { fontSize: 21, fontWeight: "900", marginTop: 4 },
  rankHelp: { fontSize: 11, marginTop: 4 },
  rankTrack: { height: 6, borderRadius: 999, overflow: "hidden", marginTop: 15 },
  rankFill: { height: "100%", borderRadius: 999 },
  rewardText: { fontSize: 13, fontWeight: "800", marginTop: 11 },
  badgeCard: { borderRadius: 16, padding: 15, marginTop: 18 },
  badgeTitle: { fontSize: 17, fontWeight: "900", marginTop: 6 },
  sectionTitle: { fontSize: 22, fontWeight: "900", letterSpacing: -.4, marginTop: 27 },
  sectionHelp: { fontSize: 13, lineHeight: 19, marginTop: 5, marginBottom: 11 },
  reviewCard: { borderRadius: 16, borderWidth: 1, padding: 15, marginBottom: 10 },
  reviewNumber: { fontSize: 9, fontWeight: "900", letterSpacing: 1.2 },
  reviewQuestion: { fontSize: 15, lineHeight: 21, fontWeight: "800", marginTop: 7 },
  reviewAnswer: { fontSize: 12, lineHeight: 18, marginTop: 9, textDecorationLine: "line-through" },
  reviewCorrect: { fontSize: 12, lineHeight: 18, fontWeight: "800", marginTop: 5 },
  reviewWhy: { fontSize: 12, lineHeight: 18, marginTop: 7 },
  nextCard: { borderRadius: 18, borderWidth: 1, padding: 17, marginTop: 10 },
  nextTitle: { fontSize: 18, lineHeight: 23, fontWeight: "900", marginTop: 7 },
  nextText: { fontSize: 13, lineHeight: 20, marginTop: 7 },
  pressed: { opacity: .72 },
  disabled: { opacity: .52 },
});
