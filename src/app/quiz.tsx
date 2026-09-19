import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import {
  RISEProgress,
  addXP,
  addSkillXP,
  getNextRecommendation,
} from "../services/progressEngine";
import { progressRepository } from "../services/progressRepository";
import { getCycleQuestions } from "../services/cycleQuiz";
import { loadProfile, updateProfile } from "../services/personalization";

type Question = {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
};

type QuizResult = {
  score: number;
  percentage: number;
  earnedXP: number;
  difficulty: string;
  skillId: string;
  goal: string;
  passed: boolean;
  badge?: string;
};

type Recommendation = {
  title: string;
  description: string;
  skillId: string | null;
  why?: string;
  difficulty?: "Easy" | "Medium" | "Hard" | "Insane";
  type?: "learning" | "quiz" | "mission" | "project" | "review";
};

const codingQuestions: Question[] = [
  {
    question: "What is a variable?",
    options: [
      "A stored value that can change",
      "A type of computer",
      "A website",
      "An error",
    ],
    answer: 0,
    explanation:
      "A variable stores a value that your program can use and change.",
  },
  {
    question: "What does a function do?",
    options: [
      "Deletes a program",
      "Groups reusable instructions",
      "Turns off the computer",
      "Only stores images",
    ],
    answer: 1,
    explanation:
      "Functions group instructions that can be reused.",
  },
  {
    question: "What is an API?",
    options: [
      "A programming language",
      "A type of keyboard",
      "A way for software systems to communicate",
      "A database only",
    ],
    answer: 2,
    explanation:
      "An API allows different software systems to communicate with each other.",
  },
  {
    question: "What is debugging?",
    options: [
      "Finding and fixing problems in code",
      "Designing a logo",
      "Deleting all code",
      "Installing a computer",
    ],
    answer: 0,
    explanation:
      "Debugging means finding and fixing errors or unexpected behavior.",
  },
  {
    question: "What does an algorithm provide?",
    options: [
      "A random answer",
      "A step-by-step way to solve a problem",
      "Only a visual design",
      "A computer battery",
    ],
    answer: 1,
    explanation:
      "An algorithm is a defined sequence of steps for solving a problem.",
  },
];

const difficulties = [
  {
    name: "Easy",
    reward: 25,
  },
  {
    name: "Medium",
    reward: 50,
  },
  {
    name: "Hard",
    reward: 100,
  },
  {
    name: "Insane",
    reward: 200,
  },
];

export default function QuizScreen() {
  const params = useLocalSearchParams();
  const cycleGate = params.cycleGate === "1";
  const cycleId = typeof params.cycleId === "string" ? params.cycleId : "current-cycle";

  /*
   * Skill being tested.
   *
   * Example:
   * /quiz?skillId=foundations
   */
  const skillId =
    typeof params.skillId === "string" && params.skillId.length > 0
      ? params.skillId
      : "foundations";

  /*
   * Goal connected to this quiz.
   *
   * This is important because RISE now keeps
   * skill progress separated by goal.
   */
  const primaryGoal =
    typeof params.goal === "string" && params.goal.length > 0
      ? params.goal
      : "personal";

  /*
   * Preserve all selected goals when navigating
   * to another RISE screen.
   */
  const selectedGoals =
    typeof params.goals === "string" && params.goals.length > 0
      ? params.goals
      : JSON.stringify([primaryGoal]);
  const questions = useMemo<Question[]>(() => cycleGate ? getCycleQuestions(`${primaryGoal} ${selectedGoals}`) : codingQuestions, [cycleGate, primaryGoal, selectedGoals]);

  const time =
    typeof params.time === "string" ? params.time : "";

  const accountability =
    typeof params.accountability === "string"
      ? params.accountability
      : "";

  const commitment =
    typeof params.commitment === "string"
      ? params.commitment
      : "";

  const [difficulty, setDifficulty] = useState("Medium");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(
    null
  );
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [recommendation, setRecommendation] =
    useState<Recommendation | null>(null);

  const selectedDifficulty =
    difficulties.find((item) => item.name === difficulty) ??
    difficulties[1];

  const handleAnswer = (index: number) => {
    if (selectedAnswer !== null || saving) {
      return;
    }

    setSelectedAnswer(index);

  };

  const finishQuiz = async () => {
    if (saving) {
      return;
    }

    setSaving(true);

    /*
     * React state may not yet contain the answer
     * to the final question.
     *
     * Therefore calculate the final score manually.
     */
    const finalScore =
      score +
      (selectedAnswer === questions[currentQuestion].answer ? 1 : 0);

    const percentage = Math.round(
      (finalScore / questions.length) * 100
    );

    const passed = !cycleGate || percentage >= 80;
    const earnedXP = cycleGate
      ? (passed ? 100 : 0)
      : Math.round(selectedDifficulty.reward * (percentage / 100));

    const earnedCoins =
      earnedXP > 0
        ? Math.max(5, Math.round(earnedXP / 5))
        : 0;

    try {
      let progress: RISEProgress =
        await progressRepository.load();

      /*
       * --------------------------------------------------
       * 1. SAVE QUIZ XP
       * --------------------------------------------------
       */
      const cycleSource = `cycle-quiz:${cycleId}`;
      const alreadyRewarded = cycleGate && progress.events.some((event) => event.type === "quiz" && event.metadata?.source === cycleSource && event.metadata?.passed === true);
      if (!alreadyRewarded && (!cycleGate || passed)) {
        progress = addXP(progress, earnedXP, "quiz", cycleGate ? `Cycle passed — ${percentage}%` : `${difficulty} Quiz — ${percentage}%`, cycleGate ? 50 : earnedCoins, {
          skillId, goal: primaryGoal, score: percentage, difficulty: cycleGate ? "Cycle review" : difficulty, source: cycleGate ? cycleSource : "quiz-engine", passed,
        });
        progress = addSkillXP(progress, skillId, earnedXP, primaryGoal);
      }

      /*
       * --------------------------------------------------
       * 2. SAVE XP TO THE SPECIFIC SKILL + GOAL
       * --------------------------------------------------
       *
       * This is important.
       *
       * Coding → Foundations
       *
       * is different from:
       *
       * Business → Foundations
       */
      const badge = cycleGate && passed ? `${skillId.replace(/-/g, " ")} Cycle Builder` : undefined;
      if (badge) {
        const profile = await loadProfile();
        await updateProfile({ cycleBadges: Array.from(new Set([...(profile.cycleBadges || []), badge])) });
      }

      /*
       * --------------------------------------------------
       * 3. RUN THE ADAPTIVE ENGINE
       * --------------------------------------------------
       *
       * RISE now looks at the updated progress and decides
       * what the user should do next.
       */
      const nextRecommendation =
        getNextRecommendation(
          progress,
          primaryGoal
        ) as Recommendation;

      /*
       * --------------------------------------------------
       * 4. SAVE EVERYTHING
       * --------------------------------------------------
       */
      await progressRepository.save(progress);

      /*
       * --------------------------------------------------
       * 5. STORE THE EXACT QUIZ RESULT
       * --------------------------------------------------
       */
      setQuizResult({
        score: finalScore,
        percentage,
        earnedXP,
        difficulty,
        skillId,
        goal: primaryGoal,
        passed,
        badge,
      });

      /*
       * Store the adaptive recommendation for
       * the result screen.
       */
      setRecommendation(nextRecommendation);

      setFinished(true);
    } catch (error) {
      console.log(
        "Failed to save quiz progress:",
        error
      );
    } finally {
      setSaving(false);
    }
  };

  const nextQuestion = () => {
    if (selectedAnswer === null || saving) {
      return;
    }

    if (currentQuestion < questions.length - 1) {
      if (selectedAnswer === questions[currentQuestion].answer) {
        setScore((previous) => previous + 1);
      }
      setCurrentQuestion((previous) => previous + 1);
      setSelectedAnswer(null);
    } else {
      finishQuiz();
    }
  };

  /*
   * --------------------------------------------------
   * RESULT SCREEN
   * --------------------------------------------------
   */
  if (finished && quizResult) {
    const nextSkill =
      recommendation?.skillId ?? quizResult.skillId;

    const nextDifficulty =
      recommendation?.difficulty ?? quizResult.difficulty;

    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.resultContent}
      >
        <View style={styles.resultCard}>
          <Text style={styles.logo}>RISE</Text>

          <Text style={styles.resultEmoji}>
            {cycleGate && !quizResult.passed
              ? "🔒"
              : quizResult.percentage >= 80
              ? "🔥"
              : quizResult.percentage >= 60
              ? "⚡"
              : "📚"}
          </Text>

          <Text style={styles.resultTitle}>
            {cycleGate && !quizResult.passed
              ? "Review Before Unlocking"
              : quizResult.percentage >= 80
              ? "Skill Progressed"
              : quizResult.percentage >= 60
              ? "Keep Building"
              : "Time to Strengthen"}
          </Text>

          <Text style={styles.score}>
            {quizResult.percentage}%
          </Text>

          <Text style={styles.resultText}>{quizResult.passed ? "You earned" : "Score 80% to unlock the next skill"}</Text>

          <Text style={styles.xpReward}>
            {quizResult.passed ? `+${quizResult.earnedXP} XP` : "Not unlocked yet"}
          </Text>

          {quizResult.badge ? <View style={styles.nextMoveCard}><Text style={styles.resultEmoji}>🏅</Text><Text style={styles.nextMoveLabel}>NEW BADGE</Text><Text style={styles.nextMoveTitle}>{quizResult.badge}</Text><Text style={styles.nextMoveDescription}>You passed the cycle review and earned 50 RISE Coins.</Text></View> : null}

          {/* QUIZ INFO */}

          <View style={styles.resultInfo}>
            <Text style={styles.resultInfoLabel}>
              DIFFICULTY
            </Text>

            <Text style={styles.resultInfoValue}>
              {quizResult.difficulty}
            </Text>

            <Text style={styles.resultInfoLabel}>
              SKILL
            </Text>

            <Text style={styles.resultInfoValue}>
              {quizResult.skillId}
            </Text>

            <Text style={styles.resultInfoLabel}>
              GOAL
            </Text>

            <Text style={styles.resultInfoValue}>
              {quizResult.goal}
            </Text>

            <Text style={styles.resultInfoLabel}>
              SCORE
            </Text>

            <Text style={styles.resultInfoValue}>
              {quizResult.score} / {questions.length}
            </Text>
          </View>

          {/* ADAPTIVE ENGINE */}

          <View style={styles.nextMoveCard}>
            <Text style={styles.nextMoveLabel}>
              YOUR NEXT MOVE
            </Text>

            <Text style={styles.nextMoveTitle}>
              {recommendation?.title ??
                "Continue your RISE path"}
            </Text>

            <Text style={styles.nextMoveDescription}>
              {recommendation?.description ??
                "RISE will use your performance to determine your next step."}
            </Text>

            <View style={styles.adaptiveStats}>
              <View style={styles.adaptiveStat}>
                <Text style={styles.adaptiveStatLabel}>
                  NEXT SKILL
                </Text>

                <Text style={styles.adaptiveStatValue}>
                  {nextSkill}
                </Text>
              </View>

              <View style={styles.adaptiveStat}>
                <Text style={styles.adaptiveStatLabel}>
                  DIFFICULTY
                </Text>

                <Text style={styles.adaptiveStatValue}>
                  {nextDifficulty}
                </Text>
              </View>
            </View>

            {recommendation?.why ? (
              <View style={styles.whyBox}>
                <Text style={styles.whyLabel}>
                  WHY THIS?
                </Text>

                <Text style={styles.whyText}>
                  {recommendation.why}
                </Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.resultText}>
            Your quiz result has been added to your
            RISE progress. Your future path can now
            adapt to how you performed.
          </Text>

          {/* NEXT MISSION */}

          <Pressable
            style={styles.button}
            onPress={async () => {
              if (cycleGate && !quizResult.passed) {
                setCurrentQuestion(0); setSelectedAnswer(null); setScore(0); setFinished(false); setQuizResult(null); return;
              }
              if (cycleGate) {
                const profile = await loadProfile();
                const goals = profile.selectedGoals.length ? profile.selectedGoals : [primaryGoal, "personal"];
                router.replace({ pathname: "/focus", params: { goal: goals[0], secondaryGoal: goals[1] || "personal", goals: JSON.stringify(goals), customGoal: profile.customGoal } } as any);
                return;
              }
              router.push({ pathname: "/action", params: { skillId: nextSkill, goal: primaryGoal, goals: selectedGoals, time, accountability, commitment, difficulty: nextDifficulty } } as any);
            }}
          >
            <Text style={styles.buttonText}>
              {cycleGate && !quizResult.passed ? "Review & Try Again" : cycleGate ? "Choose My Next Skills" : recommendation?.type === "review"
                ? "Start My Review"
                : "Start My Next Mission"}
            </Text>
          </Pressable>

          {/* PROGRESS */}

          <Pressable
            style={styles.secondaryButton}
            onPress={() =>
              router.push(
                {
                  pathname: "/progress-screen",
                  params: {
                    goal: primaryGoal,
                    goals: selectedGoals,
                  },
                } as any
              )
            }
          >
            <Text style={styles.secondaryButtonText}>
              View My Progress
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  const question = questions[currentQuestion];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.logo}>RISE</Text>

      <Text style={styles.engine}>
        RISE QUIZ ENGINE
      </Text>

      <Text style={styles.title}>
        Test What You Know
      </Text>

      <Text style={styles.subtitle}>
        Your results affect your future RISE path.
      </Text>

      {/* SKILL */}

      <View style={styles.skillBadge}>
        <Text style={styles.skillBadgeLabel}>
          SKILL BEING TESTED
        </Text>

        <Text style={styles.skillBadgeText}>
          {skillId}
        </Text>

        <Text style={styles.goalText}>
          Goal: {primaryGoal}
        </Text>
      </View>

      {/* DIFFICULTY */}

      {!cycleGate ? <><Text style={styles.sectionTitle}>
        Difficulty
      </Text>

      <View style={styles.difficultyRow}>
        {difficulties.map((item) => (
          <Pressable
            key={item.name}
            onPress={() => {
              if (saving) return;

              setDifficulty(item.name);
              setCurrentQuestion(0);
              setSelectedAnswer(null);
              setScore(0);
            }}
            style={[
              styles.difficultyButton,
              difficulty === item.name &&
                styles.selectedDifficulty,
            ]}
          >
            <Text
              style={[
                styles.difficultyText,
                difficulty === item.name &&
                  styles.selectedDifficultyText,
              ]}
            >
              {item.name}
            </Text>

            <Text
              style={[
                styles.rewardText,
                difficulty === item.name &&
                  styles.selectedDifficultyText,
              ]}
            >
              +{item.reward}
            </Text>
          </Pressable>
        ))}
      </View></> : <View style={styles.skillBadge}><Text style={styles.skillBadgeLabel}>PASS TO UNLOCK</Text><Text style={styles.skillBadgeText}>80% required · 5 questions</Text><Text style={styles.goalText}>Missed questions include explanations and can be retried.</Text></View>}

      {/* QUESTION */}

      <View style={styles.questionCard}>
        <Text style={styles.questionNumber}>
          QUESTION {currentQuestion + 1} /{" "}
          {questions.length}
        </Text>

        <Text style={styles.question}>
          {question.question}
        </Text>

        {question.options.map((option, index) => {
          const isSelected =
            selectedAnswer === index;

          const isCorrect =
            index === question.answer;

          let optionStyle: any = styles.option;
          let textStyle: any = styles.optionText;

          if (selectedAnswer !== null) {
            if (isCorrect) {
              optionStyle = styles.correctOption;
              textStyle = styles.correctText;
            } else if (isSelected) {
              optionStyle = styles.wrongOption;
              textStyle = styles.wrongText;
            }
          }

          return (
            <Pressable
              key={option}
              onPress={() => handleAnswer(index)}
              style={optionStyle}
              disabled={saving}
            >
              <Text style={textStyle}>
                {option}
              </Text>
            </Pressable>
          );
        })}

        {selectedAnswer !== null && (
          <View style={styles.explanation}>
            <Text style={styles.explanationTitle}>
              {selectedAnswer === question.answer
                ? "Correct!"
                : "Not quite."}
            </Text>

            <Text style={styles.explanationText}>
              {question.explanation}
            </Text>
          </View>
        )}
      </View>

      {selectedAnswer !== null && (
        <Pressable
          style={styles.button}
          onPress={nextQuestion}
          disabled={saving}
        >
          <Text style={styles.buttonText}>
            {saving
              ? "Saving..."
              : currentQuestion === questions.length - 1
              ? "Finish Quiz"
              : "Next Question"}
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#010807",
  },

  content: {
    padding: 24,
    paddingBottom: 50,
  },

  resultContent: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 50,
  },

  logo: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 5,
    color: "#7AF5B8",
    marginBottom: 28,
  },

  engine: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
    color: "#7AF5B8",
  },

  title: {
    fontSize: 31,
    fontWeight: "900",
    color: "#F5FFF9",
    marginTop: 7,
  },

  subtitle: {
    color: "#C8EED9",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 18,
  },

  skillBadge: {
    backgroundColor: "#071B16",
    borderWidth: 1,
    borderColor: "#1E3A31",
    borderRadius: 14,
    padding: 14,
    marginBottom: 24,
  },

  skillBadgeLabel: {
    color: "#7AF5B8",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: 5,
  },

  skillBadgeText: {
    color: "#F5FFF9",
    fontSize: 16,
    fontWeight: "800",
  },

  goalText: {
    color: "#7A9B8A",
    fontSize: 12,
    marginTop: 6,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 12,
    color: "#F5FFF9",
  },

  difficultyRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
  },

  difficultyButton: {
    flex: 1,
    backgroundColor: "#071B16",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1E3A31",
  },

  selectedDifficulty: {
    backgroundColor: "#7AF5B8",
  },

  difficultyText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#F5FFF9",
  },

  selectedDifficultyText: {
    color: "#010807",
  },

  rewardText: {
    fontSize: 10,
    color: "#B4D4C2",
    marginTop: 3,
    fontWeight: "700",
  },

  questionCard: {
    backgroundColor: "#071B16",
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: "#1E3A31",
  },

  questionNumber: {
    fontSize: 11,
    fontWeight: "900",
    color: "#19A463",
    letterSpacing: 1,
    marginBottom: 12,
  },

  question: {
    fontSize: 22,
    lineHeight: 29,
    fontWeight: "800",
    marginBottom: 20,
    color: "#F5FFF9",
  },

  option: {
    backgroundColor: "#0B1B18",
    borderWidth: 1,
    borderColor: "#1E3A31",
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },

  optionText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#F5FFF9",
  },

  correctOption: {
    backgroundColor: "rgba(122, 245, 184, 0.12)",
    borderWidth: 2,
    borderColor: "#7AF5B8",
    borderRadius: 14,
    padding: 15,
    marginBottom: 10,
  },

  correctText: {
    color: "#7AF5B8",
    fontWeight: "800",
    fontSize: 15,
  },

  wrongOption: {
    backgroundColor: "rgba(217, 83, 79, 0.08)",
    borderWidth: 2,
    borderColor: "#D9534F",
    borderRadius: 14,
    padding: 15,
    marginBottom: 10,
  },

  wrongText: {
    color: "#F7A6A0",
    fontWeight: "800",
    fontSize: 15,
  },

  explanation: {
    marginTop: 10,
    backgroundColor: "rgba(122, 245, 184, 0.08)",
    borderRadius: 14,
    padding: 15,
  },

  explanationTitle: {
    fontWeight: "900",
    color: "#19A463",
    marginBottom: 5,
  },

  explanationText: {
    color: "#C8EED9",
    lineHeight: 20,
  },

  button: {
    backgroundColor: "#7AF5B8",
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: "center",
    marginTop: 20,
  },

  buttonText: {
    color: "#010807",
    fontSize: 16,
    fontWeight: "800",
  },

  secondaryButton: {
    borderWidth: 1,
    borderColor: "#7AF5B8",
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: "center",
    marginTop: 10,
  },

  secondaryButtonText: {
    color: "#7AF5B8",
    fontSize: 16,
    fontWeight: "800",
  },

  resultCard: {
    flex: 1,
    paddingTop: 20,
  },

  resultEmoji: {
    fontSize: 55,
    marginBottom: 15,
  },

  resultTitle: {
    fontSize: 30,
    fontWeight: "900",
    color: "#F5FFF9",
  },

  score: {
    fontSize: 65,
    fontWeight: "900",
    color: "#19A463",
    marginVertical: 10,
  },

  resultText: {
    fontSize: 16,
    color: "#C8EED9",
    lineHeight: 23,
    marginTop: 5,
  },

  xpReward: {
    fontSize: 30,
    fontWeight: "900",
    color: "#19A463",
    marginVertical: 8,
  },

  resultInfo: {
    backgroundColor: "#071B16",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1E3A31",
    padding: 16,
    marginTop: 15,
    marginBottom: 14,
  },

  resultInfoLabel: {
    color: "#7A9B8A",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
    marginTop: 6,
  },

  resultInfoValue: {
    color: "#F5FFF9",
    fontSize: 15,
    fontWeight: "800",
    marginTop: 2,
  },

  nextMoveCard: {
    backgroundColor: "#071B16",
    borderWidth: 1,
    borderColor: "#7AF5B8",
    borderRadius: 20,
    padding: 18,
    marginTop: 8,
  },

  nextMoveLabel: {
    color: "#7AF5B8",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 8,
  },

  nextMoveTitle: {
    color: "#F5FFF9",
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 28,
  },

  nextMoveDescription: {
    color: "#C8EED9",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },

  adaptiveStats: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },

  adaptiveStat: {
    flex: 1,
    backgroundColor: "#0D2F22",
    borderRadius: 12,
    padding: 12,
  },

  adaptiveStatLabel: {
    color: "#7A9B8A",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },

  adaptiveStatValue: {
    color: "#F5FFF9",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 5,
  },

  whyBox: {
    marginTop: 12,
    backgroundColor: "rgba(122, 245, 184, 0.07)",
    borderRadius: 12,
    padding: 12,
  },

  whyLabel: {
    color: "#7AF5B8",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 4,
  },

  whyText: {
    color: "#C8EED9",
    fontSize: 13,
    lineHeight: 19,
  },
});
