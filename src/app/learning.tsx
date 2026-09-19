import React, { useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import {
  addSkillXP,
  addXP,
} from "../services/progressEngine";
import type { RISEProgress } from "../services/progressEngine";
import { progressRepository } from "../services/progressRepository";

type LearningStep = {
  type: string;
  title: string;
  description: string;
  duration: string;
  reward: number;
  emoji: string;
  skillId: string;
};

const paths: Record<string, LearningStep[]> = {
  coding: [
    {
      type: "WATCH",
      title: "Learn the basics of programming",
      description:
        "Understand variables, conditions, loops, functions, and how programs actually work.",
      duration: "25 min",
      reward: 50,
      emoji: "🎥",
      skillId: "foundations",
    },
    {
      type: "LEARN",
      title: "Master Python functions",
      description:
        "Learn parameters, arguments, return values, and reusable code.",
      duration: "20 min",
      reward: 50,
      emoji: "🧠",
      skillId: "foundations",
    },
    {
      type: "BUILD",
      title: "Build a calculator",
      description:
        "Create a working calculator using functions and user input.",
      duration: "30 min",
      reward: 75,
      emoji: "💻",
      skillId: "foundations",
    },
    {
      type: "QUIZ",
      title: "Test your programming knowledge",
      description:
        "Complete a short quiz to prove you understand the fundamentals.",
      duration: "10 min",
      reward: 50,
      emoji: "🧪",
      skillId: "foundations",
    },
  ],

  business: [
    {
      type: "WATCH",
      title: "Understand how businesses work",
      description:
        "Learn customers, problems, products, revenue, costs, and profit.",
      duration: "25 min",
      reward: 50,
      emoji: "🎥",
      skillId: "problem-solving",
    },
    {
      type: "LEARN",
      title: "Find a real problem",
      description:
        "Learn how entrepreneurs identify problems worth solving.",
      duration: "20 min",
      reward: 50,
      emoji: "🧠",
      skillId: "problem-solving",
    },
    {
      type: "BUILD",
      title: "Create your first business idea",
      description:
        "Choose a problem, define your customer, and design a solution.",
      duration: "30 min",
      reward: 75,
      emoji: "🚀",
      skillId: "problem-solving",
    },
    {
      type: "PROJECT",
      title: "Create a one-page business plan",
      description:
        "Write your customer, problem, solution, business model, and marketing strategy.",
      duration: "35 min",
      reward: 100,
      emoji: "📄",
      skillId: "problem-solving",
    },
  ],

  finance: [
    {
      type: "WATCH",
      title: "Learn personal finance",
      description:
        "Understand income, expenses, saving, investing, debt, and net worth.",
      duration: "25 min",
      reward: 50,
      emoji: "🎥",
      skillId: "practical-skills",
    },
    {
      type: "LEARN",
      title: "Understand investing",
      description:
        "Learn stocks, ETFs, diversification, risk, and compound growth.",
      duration: "25 min",
      reward: 50,
      emoji: "🧠",
      skillId: "practical-skills",
    },
    {
      type: "BUILD",
      title: "Build a personal budget",
      description:
        "Create a realistic monthly budget and calculate your savings rate.",
      duration: "30 min",
      reward: 75,
      emoji: "💰",
      skillId: "practical-skills",
    },
    {
      type: "PROJECT",
      title: "Create your financial plan",
      description:
        "Set savings, investing, and long-term financial goals.",
      duration: "35 min",
      reward: 100,
      emoji: "📈",
      skillId: "practical-skills",
    },
  ],

  engineering: [
    {
      type: "WATCH",
      title: "Engineering fundamentals",
      description:
        "Learn problem solving, systems thinking, design constraints, and iteration.",
      duration: "25 min",
      reward: 50,
      emoji: "🎥",
      skillId: "problem-solving",
    },
    {
      type: "LEARN",
      title: "Learn the engineering design process",
      description:
        "Identify a problem, research, design, prototype, test, and improve.",
      duration: "25 min",
      reward: 50,
      emoji: "🧠",
      skillId: "problem-solving",
    },
    {
      type: "BUILD",
      title: "Design a solution",
      description:
        "Create a CAD, electronics, mechanical, or software prototype.",
      duration: "40 min",
      reward: 100,
      emoji: "⚙️",
      skillId: "problem-solving",
    },
    {
      type: "PROJECT",
      title: "Document your engineering project",
      description:
        "Record the problem, design decisions, prototype, testing, and results.",
      duration: "30 min",
      reward: 100,
      emoji: "📐",
      skillId: "problem-solving",
    },
  ],

  education: [
    {
      type: "LEARN",
      title: "Build a better study system",
      description:
        "Learn active recall, spaced repetition, practice testing, and focused study.",
      duration: "20 min",
      reward: 50,
      emoji: "🧠",
      skillId: "foundations",
    },
    {
      type: "BUILD",
      title: "Create your study plan",
      description:
        "Turn your subjects and deadlines into a weekly learning system.",
      duration: "25 min",
      reward: 50,
      emoji: "📚",
      skillId: "foundations",
    },
    {
      type: "PRACTICE",
      title: "Complete a focused study session",
      description:
        "Study one difficult concept without distractions and record what you learned.",
      duration: "30 min",
      reward: 50,
      emoji: "✍️",
      skillId: "foundations",
    },
  ],

  fitness: [
    {
      type: "LEARN",
      title: "Understand fitness fundamentals",
      description:
        "Learn strength, conditioning, recovery, nutrition, and progressive overload.",
      duration: "20 min",
      reward: 50,
      emoji: "🧠",
      skillId: "practical-skills",
    },
    {
      type: "WATCH",
      title: "Learn proper exercise technique",
      description:
        "Study safe technique for the movements in your training plan.",
      duration: "20 min",
      reward: 50,
      emoji: "🎥",
      skillId: "practical-skills",
    },
    {
      type: "PRACTICE",
      title: "Complete your workout",
      description:
        "Complete the workout assigned to you and record what you accomplished.",
      duration: "45 min",
      reward: 75,
      emoji: "💪",
      skillId: "practical-skills",
    },
  ],
};

const defaultPath: LearningStep[] = [
  {
    type: "LEARN",
    title: "Understand your goal",
    description:
      "Research the fundamentals of your chosen area and identify the skills you need.",
    duration: "20 min",
    reward: 50,
    emoji: "🧠",
    skillId: "foundations",
  },
  {
    type: "WATCH",
    title: "Study a high-quality lesson",
    description:
      "Watch or complete a trusted lesson related to your goal.",
    duration: "25 min",
    reward: 50,
    emoji: "🎥",
    skillId: "foundations",
  },
  {
    type: "PRACTICE",
    title: "Put the knowledge into practice",
    description:
      "Complete an activity that demonstrates what you learned.",
    duration: "30 min",
    reward: 75,
    emoji: "✍️",
    skillId: "foundations",
  },
  {
    type: "PROJECT",
    title: "Create something real",
    description:
      "Turn what you learned into a small project you can show.",
    duration: "40 min",
    reward: 100,
    emoji: "🚀",
    skillId: "foundations",
  },
];

export default function LearningScreen() {
  const params = useLocalSearchParams();

  const [completed, setCompleted] = useState<number[]>([]);
  const [savedProgress, setSavedProgress] =
    useState<RISEProgress | null>(null);
  const [savingIndex, setSavingIndex] = useState<number | null>(null);

  const selectedGoals = useMemo(() => {
    try {
      if (!params.goals) return [];

      const raw = Array.isArray(params.goals)
        ? params.goals[0]
        : params.goals;

      const parsed = JSON.parse(raw);

      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [params.goals]);

  const primaryGoal =
    selectedGoals[0] || "personal";

  const steps =
    paths[primaryGoal] || defaultPath;

  const completedCount = completed.length;

  const pathProgress =
    steps.length > 0
      ? completedCount / steps.length
      : 0;

  const pathXP = completed.reduce(
    (total, index) => total + steps[index].reward,
    0
  );

  React.useEffect(() => {
    let active = true;

    const loadProgress = async () => {
      try {
        const progress = await progressRepository.load();

        if (!active) return;

        setSavedProgress(progress);

        // Restore completed learning steps from saved XP events.
        const completedIndexes = steps.reduce<number[]>(
          (indexes, step, index) => {
            const alreadyCompleted = progress.events.some(
              (event) =>
                event.type === "learning" &&
                event.title === `Completed Learning: ${step.title}`
            );

            if (alreadyCompleted) {
              indexes.push(index);
            }

            return indexes;
          },
          []
        );

        setCompleted(completedIndexes);
      } catch (error) {
        console.log(
          "Failed to load learning progress:",
          error
        );
      }
    };

    loadProgress();

    return () => {
      active = false;
    };
  }, [steps]);

  const markComplete = async (index: number) => {
    if (
      completed.includes(index) ||
      savingIndex !== null
    ) {
      return;
    }

    const step = steps[index];
    const eventTitle = `Completed Learning: ${step.title}`;

    setSavingIndex(index);

    try {
      let progress =
        savedProgress ??
        (await progressRepository.load());

      // Safety check: never award XP twice for the same learning step.
      const alreadySaved = progress.events.some(
        (event) =>
          event.type === "learning" &&
          event.title === eventTitle
      );

      if (alreadySaved) {
        setSavedProgress(progress);
        setCompleted((current) =>
          current.includes(index)
            ? current
            : [...current, index]
        );
        return;
      }

      progress = addXP(
        progress,
        step.reward,
        "learning",
        eventTitle
      );

      progress = addSkillXP(
        progress,
        step.skillId,
        step.reward
      );

      await progressRepository.save(progress);

      setSavedProgress(progress);

      setCompleted((current) =>
        current.includes(index)
          ? current
          : [...current, index]
      );
    } catch (error) {
      console.log(
        "Failed to save learning progress:",
        error
      );
    } finally {
      setSavingIndex(null);
    }
  };

  const openProof = (step: LearningStep) => {
    if (step.type === "QUIZ") {
      router.push({
        pathname: "/quiz",
        params: {
          task: step.title,
          type: step.type,
          reward: String(step.reward),
          skillId: step.skillId,
        },
      } as any);
      return;
    }

    router.push({
      pathname: "/proof",
      params: {
        task: step.title,
        type: step.type,
        reward: String(step.reward),
        skillId: step.skillId,
      },
    } as any);
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        <Text style={styles.eyebrow}>
          RISE LEARNING ENGINE
        </Text>

        <Text style={styles.title}>
          Master{" "}
          <Text style={styles.green}>
            {goalTitle(primaryGoal)}.
          </Text>
        </Text>

        <Text style={styles.subtitle}>
          RISE turns your goal into specific things
          to learn, watch, practice, and build.
        </Text>

        {/* PROGRESS */}

        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={styles.progressLabel}>
                LEARNING PATH
              </Text>

              <Text style={styles.progressTitle}>
                Level 1 • Foundations
              </Text>
            </View>

            <Text style={styles.progressPercent}>
              {Math.round(pathProgress * 100)}%
            </Text>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${pathProgress * 100}%`,
                },
              ]}
            />
          </View>

          <View style={styles.progressBottom}>
            <Text style={styles.progressSmall}>
              {completedCount}/{steps.length} completed
            </Text>

            <Text style={styles.xp}>
              +{pathXP} XP
            </Text>
          </View>
        </View>

        {/* PATH */}

        <Text style={styles.sectionTitle}>
          YOUR PATH
        </Text>

        {steps.map((step, index) => {
          const isCompleted =
            completed.includes(index);

          const isNext =
            !isCompleted &&
            completedCount === index;

          return (
            <View
              key={`${step.title}-${index}`}
              style={[
                styles.stepCard,
                isNext && styles.stepCardNext,
                isCompleted &&
                  styles.stepCardCompleted,
              ]}
            >
              <View style={styles.stepTop}>
                <View
                  style={[
                    styles.stepIcon,
                    isCompleted &&
                      styles.stepIconCompleted,
                  ]}
                >
                  {isCompleted ? (
                    <Text style={styles.check}>
                      ✓
                    </Text>
                  ) : (
                    <Text style={styles.stepEmoji}>
                      {step.emoji}
                    </Text>
                  )}
                </View>

                <View style={styles.stepInfo}>
                  <Text style={styles.stepType}>
                    {step.type}
                  </Text>

                  <Text
                    style={[
                      styles.stepTitle,
                      isCompleted &&
                        styles.completedText,
                    ]}
                  >
                    {step.title}
                  </Text>

                  <Text style={styles.stepDescription}>
                    {step.description}
                  </Text>
                </View>
              </View>

              <View style={styles.stepBottom}>
                <Text style={styles.duration}>
                  ⏱ {step.duration}
                </Text>

                <Text style={styles.reward}>
                  🪙 +{step.reward} XP
                </Text>
              </View>

              {!isCompleted && (
                <View style={styles.actions}>
                  <Pressable
                    style={styles.completeButton}
                    onPress={() =>
                      markComplete(index)
                    }
                    disabled={
                      savingIndex !== null
                    }
                  >
                    <Text style={styles.completeButtonText}>
                      {savingIndex === index
                        ? "Saving..."
                        : "Mark Complete"}
                    </Text>
                  </Pressable>

                  <Pressable
                    style={styles.proofButton}
                    onPress={() => openProof(step)}
                  >
                    <Text style={styles.proofButtonText}>
                      📸 Prove It
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          );
        })}

        {/* NEXT LEVEL */}

        {completedCount === steps.length && (
          <View style={styles.successCard}>
            <Text style={styles.successEmoji}>
              🚀
            </Text>

            <Text style={styles.successTitle}>
              Level complete.
            </Text>

            <Text style={styles.successText}>
              You proved that you can learn and apply
              new skills. RISE can now move you to the
              next level.
            </Text>
          </View>
        )}

        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>
            ← Back to Plan
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function goalTitle(goal: string) {
  if (goal === "coding") return "Coding";
  if (goal === "business") return "Business";
  if (goal === "finance") return "Finance";
  if (goal === "engineering") return "Engineering";
  if (goal === "education") return "Education";
  if (goal === "fitness") return "Fitness";

  return "Your Goal";
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#010807",
  },

  container: {
    paddingHorizontal: 22,
    paddingTop: 60,
    paddingBottom: 50,
  },

  eyebrow: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.7,
    color: "#7AF5B8",
    marginBottom: 17,
  },

  title: {
    fontSize: 36,
    lineHeight: 41,
    fontWeight: "900",
    color: "#F5FFF9",
    marginBottom: 13,
  },

  green: {
    color: "#7AF5B8",
  },

  subtitle: {
    fontSize: 15,
    lineHeight: 23,
    color: "#C8EED9",
    marginBottom: 25,
  },

  progressCard: {
    backgroundColor: "#071B16",
    borderRadius: 22,
    padding: 19,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: "#1E3A31",
  },

  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 14,
  },

  progressLabel: {
    color: "#B4D4C2",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.3,
    marginBottom: 5,
  },

  progressTitle: {
    color: "#F5FFF9",
    fontSize: 15,
    fontWeight: "900",
  },

  progressPercent: {
    color: "#7AF5B8",
    fontSize: 21,
    fontWeight: "900",
  },

  progressTrack: {
    height: 7,
    borderRadius: 10,
    backgroundColor: "#1E3A31",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 10,
    backgroundColor: "#7AF5B8",
  },

  progressBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },

  progressSmall: {
    color: "#B4D4C2",
    fontSize: 11,
  },

  xp: {
    color: "#F5FFF9",
    fontSize: 11,
    fontWeight: "900",
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 13,
    color: "#B4D4C2",
  },

  stepCard: {
    borderWidth: 1.5,
    borderColor: "#1E3A31",
    borderRadius: 21,
    padding: 16,
    marginBottom: 13,
    backgroundColor: "#071B16",
  },

  stepCardNext: {
    borderColor: "#7AF5B8",
    backgroundColor: "#0D2F22",
  },

  stepCardCompleted: {
    backgroundColor: "#0D2F22",
    borderColor: "#2D5F4D",
  },

  stepTop: {
    flexDirection: "row",
  },

  stepIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: "#11382B",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  stepIconCompleted: {
    backgroundColor: "#7AF5B8",
  },

  stepEmoji: {
    fontSize: 23,
  },

  check: {
    color: "#010807",
    fontSize: 22,
    fontWeight: "900",
  },

  stepInfo: {
    flex: 1,
  },

  stepType: {
    color: "#7AF5B8",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.3,
    marginBottom: 4,
  },

  stepTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#F5FFF9",
    marginBottom: 5,
  },

  completedText: {
    color: "#7AF5B8",
  },

  stepDescription: {
    fontSize: 12,
    lineHeight: 18,
    color: "#B4D4C2",
  },

  stepBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#1E3A31",
  },

  duration: {
    fontSize: 11,
    color: "#C8EED9",
    fontWeight: "700",
  },

  reward: {
    fontSize: 11,
    color: "#7AF5B8",
    fontWeight: "900",
  },

  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 13,
  },

  completeButton: {
    flex: 1,
    height: 43,
    borderRadius: 13,
    backgroundColor: "#010807",
    borderWidth: 1,
    borderColor: "#7AF5B8",
    alignItems: "center",
    justifyContent: "center",
  },

  completeButtonText: {
    color: "#7AF5B8",
    fontSize: 11,
    fontWeight: "900",
  },

  proofButton: {
    flex: 1,
    height: 43,
    borderRadius: 13,
    backgroundColor: "#0D2F22",
    borderWidth: 1,
    borderColor: "#1E3A31",
    alignItems: "center",
    justifyContent: "center",
  },

  proofButtonText: {
    color: "#7AF5B8",
    fontSize: 11,
    fontWeight: "900",
  },

  successCard: {
    marginTop: 5,
    padding: 22,
    borderRadius: 21,
    backgroundColor: "#0D2F22",
    borderWidth: 1,
    borderColor: "#1E3A31",
    alignItems: "center",
  },

  successEmoji: {
    fontSize: 34,
    marginBottom: 8,
  },

  successTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#F5FFF9",
    marginBottom: 7,
  },

  successText: {
    fontSize: 12,
    lineHeight: 19,
    color: "#C8EED9",
    textAlign: "center",
  },

  backButton: {
    marginTop: 22,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },

  backText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#B4D4C2",
  },
});
