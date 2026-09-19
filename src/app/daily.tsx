import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  router,
  useLocalSearchParams,
} from "expo-router";

import {
  RISEProgress,
  addXP,
  addSkillXP,
  createDefaultProgress,
  getCurrentLevelXP,
  getXPForNextLevel,
  progressRepository,
  normalizeGoal,
} from "../services/progressEngine";

// ============================================================
// TYPES
// ============================================================

type DailyTask = {
  id: string;
  goal: string;
  emoji: string;
  title: string;
  task: string;
  duration: number;
  skillId: string;
  xp: number;
  coins: number;
};

type SelectedTask = {
  id?: string;
  goal?: string;
  emoji?: string;
  title?: string;
  task?: string;
  duration?: number;
  skillId?: string;
};

// ============================================================
// STORAGE
// ============================================================

const DAILY_STORAGE_PREFIX = "RISE_DAILY_COMPLETED";

function getLocalDateKey(): string {
  const date = new Date();

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

function getDailyStorageKey(dateKey: string): string {
  return `${DAILY_STORAGE_PREFIX}_${dateKey}`;
}

// ============================================================
// DAILY REWARD SOURCE
// ============================================================

function getDailyRewardSource(
  dateKey: string,
  task: DailyTask
): string {
  return [
    "daily",
    dateKey,
    normalizeGoal(task.goal),
    task.skillId,
    task.task.trim().toLowerCase(),
  ].join(":");
}

// ============================================================
// DAILY TASK DATABASE
// ============================================================

const goalData: Record<
  string,
  Omit<DailyTask, "id" | "goal" | "xp" | "coins">
> = {
  education: {
    emoji: "📚",
    title: "Study & Learn",
    task: "Complete 25 minutes of focused study on an important topic.",
    duration: 25,
    skillId: "foundations",
  },

  fitness: {
    emoji: "💪",
    title: "Move Your Body",
    task: "Complete a focused workout or movement session.",
    duration: 20,
    skillId: "foundations",
  },

  coding: {
    emoji: "💻",
    title: "Build a Coding Skill",
    task: "Spend focused time coding and solve one meaningful problem.",
    duration: 25,
    skillId: "foundations",
  },

  business: {
    emoji: "💼",
    title: "Learn Business",
    task: "Study one business concept and write down one useful insight.",
    duration: 20,
    skillId: "foundations",
  },

  finance: {
    emoji: "💰",
    title: "Learn About Money",
    task: "Learn one financial concept and connect it to a real-world example.",
    duration: 15,
    skillId: "foundations",
  },

  engineering: {
    emoji: "⚙️",
    title: "Work on Engineering",
    task: "Work through one engineering problem or design challenge.",
    duration: 25,
    skillId: "foundations",
  },

  medicine: {
    emoji: "🩺",
    title: "Study Medicine",
    task: "Learn one important medical concept and explain it in your own words.",
    duration: 25,
    skillId: "foundations",
  },

  law: {
    emoji: "⚖️",
    title: "Study Law",
    task: "Study one legal concept, case, or principle.",
    duration: 20,
    skillId: "foundations",
  },

  science: {
    emoji: "🔬",
    title: "Explore Science",
    task: "Study one scientific concept and explain why it matters.",
    duration: 20,
    skillId: "foundations",
  },

  math: {
    emoji: "📐",
    title: "Practice Math",
    task: "Complete focused practice on a math topic you are developing.",
    duration: 25,
    skillId: "foundations",
  },

  writing: {
    emoji: "✍️",
    title: "Write & Create",
    task: "Write something meaningful for 20 focused minutes.",
    duration: 20,
    skillId: "foundations",
  },

  art: {
    emoji: "🎨",
    title: "Create Something",
    task: "Spend focused time creating or improving a piece of art.",
    duration: 20,
    skillId: "foundations",
  },

  music: {
    emoji: "🎵",
    title: "Practice Music",
    task: "Complete a focused music practice session.",
    duration: 20,
    skillId: "foundations",
  },

  sports: {
    emoji: "🏀",
    title: "Practice Your Sport",
    task: "Complete a focused skill or performance session.",
    duration: 30,
    skillId: "foundations",
  },

  leadership: {
    emoji: "👑",
    title: "Develop Leadership",
    task: "Study or practice one leadership skill.",
    duration: 15,
    skillId: "foundations",
  },

  entrepreneurship: {
    emoji: "🚀",
    title: "Build Your Idea",
    task: "Make measurable progress on a real business or startup idea.",
    duration: 25,
    skillId: "projects",
  },

  marketing: {
    emoji: "📣",
    title: "Learn Marketing",
    task: "Study one marketing concept and apply it to a real example.",
    duration: 20,
    skillId: "foundations",
  },

  psychology: {
    emoji: "🧠",
    title: "Study Psychology",
    task: "Learn one psychology concept and explain it in your own words.",
    duration: 20,
    skillId: "foundations",
  },

  social: {
    emoji: "🌎",
    title: "Build Connections",
    task: "Have one meaningful conversation or strengthen a relationship.",
    duration: 15,
    skillId: "practical-skills",
  },

  architecture: {
    emoji: "🏛️",
    title: "Practice Design",
    task: "Study or create one design concept.",
    duration: 25,
    skillId: "practical-skills",
  },

  environment: {
    emoji: "🌱",
    title: "Learn & Take Action",
    task: "Learn about an environmental issue and take one useful action.",
    duration: 15,
    skillId: "foundations",
  },

  languages: {
    emoji: "🌐",
    title: "Practice a Language",
    task: "Practice vocabulary, speaking, reading, or listening.",
    duration: 20,
    skillId: "foundations",
  },

  personal: {
    emoji: "✨",
    title: "Reflect & Improve",
    task: "Reflect on your day and identify one thing you can improve.",
    duration: 15,
    skillId: "foundations",
  },

  productivity: {
    emoji: "🎯",
    title: "Improve Your System",
    task: "Improve one part of your schedule, workflow, or daily system.",
    duration: 15,
    skillId: "practical-skills",
  },

  creativity: {
    emoji: "💡",
    title: "Create Something New",
    task: "Spend focused time creating something original.",
    duration: 20,
    skillId: "projects",
  },
};

// ============================================================
// SCREEN
// ============================================================

export default function DailyScreen() {
  const params = useLocalSearchParams();

  // ==========================================================
  // STATE
  // ==========================================================

  const [progress, setProgress] =
    useState<RISEProgress>(createDefaultProgress());

  const [completedTasks, setCompletedTasks] =
    useState<string[]>([]);

  const [activeTab, setActiveTab] =
    useState<"today" | "progress" | "coins" | "profile">(
      "today"
    );

  const [savingTask, setSavingTask] =
    useState<string | null>(null);

  const [selectedTask, setSelectedTask] =
    useState<SelectedTask | null>(null);

  const fadeAnim =
    useRef(new Animated.Value(0)).current;

  const slideAnim =
    useRef(new Animated.Value(12)).current;

  // ==========================================================
  // GOALS
  // ==========================================================

  const selectedGoals = useMemo(() => {
    try {
      if (!params.goals) {
        return [];
      }

      const rawGoals =
        Array.isArray(params.goals)
          ? params.goals[0]
          : params.goals;

      const parsed = JSON.parse(String(rawGoals));

      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed
        .map((goal) =>
          normalizeGoal(String(goal))
        )
        .filter(Boolean);
    } catch {
      return [];
    }
  }, [params.goals]);

  const routeGoal = useMemo(() => {
    if (!params.goal) {
      return "";
    }

    const rawGoal =
      Array.isArray(params.goal)
        ? params.goal[0]
        : params.goal;

    return normalizeGoal(String(rawGoal));
  }, [params.goal]);

  const primaryGoal =
    routeGoal ||
    selectedGoals[0] ||
    "personal";

  // ==========================================================
  // SETTINGS
  // ==========================================================

  const time = useMemo(() => {
    if (!params.time) {
      return "30–60 minutes";
    }

    return Array.isArray(params.time)
      ? params.time[0]
      : String(params.time);
  }, [params.time]);

  const accountability = useMemo(() => {
    if (!params.accountability) {
      return "Keep me consistent";
    }

    return Array.isArray(params.accountability)
      ? params.accountability[0]
      : String(params.accountability);
  }, [params.accountability]);

  const commitment = useMemo(() => {
    if (!params.commitment) {
      return "30 days";
    }

    return Array.isArray(params.commitment)
      ? params.commitment[0]
      : String(params.commitment);
  }, [params.commitment]);

  // ==========================================================
  // TIME LIMIT
  // ==========================================================

  const timeLimit = useMemo(() => {
    const normalized = time.toLowerCase();

    if (
      normalized.includes("less than 30")
    ) {
      return 25;
    }

    if (
      normalized.includes("30") &&
      normalized.includes("60")
    ) {
      return 50;
    }

    if (
      normalized.includes("1–2") ||
      normalized.includes("1-2") ||
      normalized.includes("1 to 2")
    ) {
      return 90;
    }

    if (
      normalized.includes("2+") ||
      normalized.includes("2 or more")
    ) {
      return 120;
    }

    return 50;
  }, [time]);

  // ==========================================================
  // ACCOUNTABILITY INTENSITY
  // ==========================================================

  const intensity = useMemo(() => {
    const value =
      accountability.toLowerCase();

    if (
      value.includes("push me hard")
    ) {
      return 1.2;
    }

    if (
      value.includes("don't overwhelm") ||
      value.includes("do not overwhelm")
    ) {
      return 0.7;
    }

    if (
      value.includes("realistic")
    ) {
      return 0.85;
    }

    return 1;
  }, [accountability]);

  // ==========================================================
  // GENERATE DAILY TASKS
  // ==========================================================

  const tasks = useMemo<DailyTask[]>(() => {
    const goals =
      selectedGoals.length > 0
        ? selectedGoals
        : [primaryGoal];

    let remainingTime = timeLimit;

    const generated: DailyTask[] = [];

    for (const goal of goals) {
      // Never create tiny leftover tasks.
      if (remainingTime < 5) {
        break;
      }

      const data =
        goalData[goal] ||
        goalData.personal;

      const calculatedDuration =
        Math.max(
          5,
          Math.round(
            data.duration * intensity
          )
        );

      const duration =
        Math.min(
          calculatedDuration,
          remainingTime
        );

      if (duration < 5) {
        continue;
      }

      const xp =
        Math.max(
          10,
          Math.round(duration * 2)
        );

      const coins = 10;

      const taskSlug =
        data.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");

      generated.push({
        id: `${normalizeGoal(goal)}-${data.skillId}-${taskSlug}`,

        goal: normalizeGoal(goal),

        emoji: data.emoji,

        title: data.title,

        task: data.task,

        duration,

        skillId: data.skillId,

        xp,

        coins,
      });

      remainingTime -= duration;
    }

    return generated;
  }, [
    selectedGoals,
    primaryGoal,
    timeLimit,
    intensity,
  ]);

  // ==========================================================
  // LOAD DATA + RECONCILE DAILY COMPLETION
  // ==========================================================

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const dateKey =
          getLocalDateKey();

        const storageKey =
          getDailyStorageKey(dateKey);

        const storedProgress =
          await progressRepository.load();

        const safeProgress =
          storedProgress ||
          createDefaultProgress();

        const storedCompletedRaw =
          await AsyncStorage.getItem(
            storageKey
          );

        let storedCompleted: string[] = [];

        if (storedCompletedRaw) {
          try {
            const parsed =
              JSON.parse(
                storedCompletedRaw
              );

            if (Array.isArray(parsed)) {
              storedCompleted =
                parsed.filter(
                  (item) =>
                    typeof item === "string"
                );
            }
          } catch {
            storedCompleted = [];
          }
        }

        /*
         * Reconcile AsyncStorage with the actual
         * RISE progress event history.
         *
         * This means that even if the local daily
         * completion list disappears, a task that
         * was already rewarded today still appears
         * as completed.
         */
        const eventCompleted =
          tasks
            .filter((task) => {
              const source =
                getDailyRewardSource(
                  dateKey,
                  task
                );

              return safeProgress.events.some(
                (event) =>
                  event.metadata?.source ===
                  source
              );
            })
            .map((task) =>
              task.id
            );

        const reconciled =
          Array.from(
            new Set([
              ...storedCompleted,
              ...eventCompleted,
            ])
          ).filter((taskId) =>
            tasks.some(
              (task) =>
                task.id === taskId
            )
          );

        if (mounted) {
          setProgress(
            safeProgress
          );

          setCompletedTasks(
            reconciled
          );
        }

        if (
          reconciled.length !==
            storedCompleted.length ||
          reconciled.some(
            (item) =>
              !storedCompleted.includes(item)
          )
        ) {
          await AsyncStorage.setItem(
            storageKey,
            JSON.stringify(reconciled)
          );
        }
      } catch (error) {
        console.warn(
          "RISE: Failed to load daily data",
          error
        );

        if (mounted) {
          setProgress(
            createDefaultProgress()
          );

          setCompletedTasks([]);
        }
      }
    }

    loadData();

    Animated.parallel([
      Animated.timing(
        fadeAnim,
        {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }
      ),

      Animated.timing(
        slideAnim,
        {
          toValue: 0,
          duration: 450,
          useNativeDriver: true,
        }
      ),
    ]).start();

    return () => {
      mounted = false;
    };
  }, [
    fadeAnim,
    slideAnim,
    tasks,
  ]);

  // ==========================================================
  // SELECTED TASK FROM ROUTE
  // ==========================================================

  useEffect(() => {
    if (!params.task) {
      setSelectedTask(null);
      return;
    }

    try {
      const rawTask =
        Array.isArray(params.task)
          ? params.task[0]
          : params.task;

      setSelectedTask({
        task: String(rawTask),

        title:
          Array.isArray(params.title)
            ? params.title[0]
            : params.title,

        duration:
          params.duration
            ? Number(
                Array.isArray(params.duration)
                  ? params.duration[0]
                  : params.duration
              )
            : undefined,

        skillId:
          Array.isArray(params.skillId)
            ? params.skillId[0]
            : params.skillId,

        goal:
          Array.isArray(params.goal)
            ? params.goal[0]
            : params.goal,

        emoji:
          Array.isArray(params.emoji)
            ? params.emoji[0]
            : params.emoji,
      });
    } catch {
      setSelectedTask(null);
    }
  }, [
    params.task,
    params.title,
    params.duration,
    params.skillId,
    params.goal,
    params.emoji,
  ]);

  // ==========================================================
  // STATS
  // ==========================================================

  const completedCount =
    completedTasks.filter((taskId) =>
      tasks.some(
        (task) =>
          task.id === taskId
      )
    ).length;

  const completionProgress =
    tasks.length > 0
      ? Math.min(
          1,
          completedCount /
            tasks.length
        )
      : 0;

  const totalMinutes =
    tasks.reduce(
      (sum, task) =>
        sum + task.duration,
      0
    );

  const completedXP =
    tasks
      .filter((task) =>
        completedTasks.includes(
          task.id
        )
      )
      .reduce(
        (sum, task) =>
          sum + task.xp,
        0
      );

  const completedCoins =
    tasks
      .filter((task) =>
        completedTasks.includes(
          task.id
        )
      )
      .reduce(
        (sum, task) =>
          sum + task.coins,
        0
      );

  // ==========================================================
  // LEVEL SUMMARY
  // ==========================================================

  const progressSummary =
    useMemo(() => {
      const level =
        Math.max(
          1,
          progress.level || 1
        );

      const xpForNextLevel =
        getXPForNextLevel(
          level
        );

      const currentLevelXP =
        getCurrentLevelXP(
          progress.totalXP
        );

      const progressPercent =
        xpForNextLevel > 0
          ? Math.min(
              1,
              Math.max(
                0,
                currentLevelXP /
                  xpForNextLevel
              )
            )
          : 0;

      const currentGoalLabel =
        primaryGoal
          .replace(
            /[-_]/g,
            " "
          )
          .replace(
            /\b\w/g,
            (letter) =>
              letter.toUpperCase()
          );

      return {
        currentGoalLabel,

        progressPercent,

        xpForNextLevel,

        currentLevelXP,

        xpToNextLevel:
          Math.max(
            0,
            xpForNextLevel -
              currentLevelXP
          ),
      };
    }, [
      progress,
      primaryGoal,
    ]);

  // ==========================================================
  // WHY THIS
  // ==========================================================

  const whyThis =
    useMemo(() => {
      if (
        progress.totalXP === 0 &&
        completedCount === 0
      ) {
        return "RISE is starting with small, focused actions so you can build momentum without overwhelming yourself.";
      }

      if (
        completionProgress >= 1
      ) {
        return "You completed today's plan. Consistency compounds — tomorrow RISE will give you another focused path forward.";
      }

      if (
        progress.totalXP < 500
      ) {
        return "RISE is building your foundations first. Consistent small actions create the skill base you need for harder challenges.";
      }

      return "Your daily missions are connected to your selected goals so your actions contribute directly to your long-term skill development.";
    }, [
      progress.totalXP,
      completedCount,
      completionProgress,
    ]);

  // ==========================================================
  // SAVE DAILY COMPLETION
  // ==========================================================

  const saveCompletedTasks =
    async (
      nextCompleted: string[]
    ) => {
      try {
        const key =
          getDailyStorageKey(
            getLocalDateKey()
          );

        await AsyncStorage.setItem(
          key,
          JSON.stringify(
            Array.from(
              new Set(nextCompleted)
            )
          )
        );
      } catch (error) {
        console.warn(
          "RISE: Failed to save daily completion",
          error
        );
      }
    };

  // ==========================================================
  // TASK KEY
  // ==========================================================

  const getTaskKey = (
    task: DailyTask
  ) => task.id;

  // ==========================================================
  // CHECK IF TASK WAS ALREADY REWARDED TODAY
  // ==========================================================

  const wasTaskRewarded =
    (
      currentProgress: RISEProgress,
      task: DailyTask
    ) => {
      const dateKey =
        getLocalDateKey();

      const rewardSource =
        getDailyRewardSource(
          dateKey,
          task
        );

      return currentProgress.events.some(
        (event) =>
          event.metadata?.source ===
          rewardSource
      );
    };

  // ==========================================================
  // TOGGLE TASK
  // ==========================================================

  const toggleTask =
    async (
      task: DailyTask
    ) => {
      const taskKey =
        getTaskKey(task);

      if (
        savingTask === taskKey
      ) {
        return;
      }

      const alreadyCompleted =
        completedTasks.includes(
          taskKey
        );

      // ------------------------------------------------------
      // UNCHECK
      // ------------------------------------------------------

      if (alreadyCompleted) {
        const nextCompleted =
          completedTasks.filter(
            (item) =>
              item !== taskKey
          );

        setCompletedTasks(
          nextCompleted
        );

        await saveCompletedTasks(
          nextCompleted
        );

        /*
         * IMPORTANT:
         *
         * We intentionally do NOT remove XP
         * or coins here.
         *
         * Once RISE rewards a completed action,
         * the reward remains in the progress history.
         *
         * If the user checks it again today,
         * the event source prevents another reward.
         */
        return;
      }

      // ------------------------------------------------------
      // COMPLETE
      // ------------------------------------------------------

      try {
        setSavingTask(
          taskKey
        );

        const dateKey =
          getLocalDateKey();

        const rewardSource =
          getDailyRewardSource(
            dateKey,
            task
          );

        let updatedProgress =
          await progressRepository.load();

        if (!updatedProgress) {
          updatedProgress =
            createDefaultProgress();
        }

        // ----------------------------------------------------
        // SAFETY CHECK
        // ----------------------------------------------------

        const alreadyRewarded =
          updatedProgress.events.some(
            (event) =>
              event.metadata?.source ===
              rewardSource
          );

        // ----------------------------------------------------
        // REWARD
        // ----------------------------------------------------

        if (!alreadyRewarded) {
          updatedProgress =
            addXP(
              updatedProgress,

              task.xp,

              "learning",

              `Daily Task: ${task.task}`,

              task.coins,

              {
                goal: task.goal,

                skillId:
                  task.skillId,

                durationMinutes:
                  task.duration,

                source:
                  rewardSource,
              }
            );

          updatedProgress =
            addSkillXP(
              updatedProgress,

              task.skillId,

              task.xp,

              task.goal
            );

          await progressRepository.save(
            updatedProgress
          );
        }

        // ----------------------------------------------------
        // UPDATE SCREEN
        // ----------------------------------------------------

        setProgress(
          updatedProgress
        );

        const nextCompleted =
          Array.from(
            new Set([
              ...completedTasks,
              taskKey,
            ])
          );

        setCompletedTasks(
          nextCompleted
        );

        await saveCompletedTasks(
          nextCompleted
        );
      } catch (error) {
        console.warn(
          "RISE: Failed to complete daily task",
          error
        );
      } finally {
        setSavingTask(null);
      }
    };

  // ==========================================================
  // PROOF
  // ==========================================================

  const openProof = (
    task: DailyTask
  ) => {
    router.push({
      pathname: "/proof",

      params: {
        task: task.task,

        title: task.title,

        goal: task.goal,

        skillId:
          task.skillId,

        duration:
          String(task.duration),

        emoji:
          task.emoji,

        goals: JSON.stringify(
          selectedGoals.length
            ? selectedGoals
            : [primaryGoal]
        ),

        time,

        accountability,

        commitment,
      },
    } as any);
  };

  // ==========================================================
  // NAVIGATION
  // ==========================================================

  const navigationParams =
    useMemo(
      () => ({
        goals:
          params.goals ||
          JSON.stringify(
            selectedGoals.length
              ? selectedGoals
              : [primaryGoal]
          ),

        goal:
          primaryGoal,

        time,

        accountability,

        commitment,
      }),
      [
        params.goals,
        selectedGoals,
        primaryGoal,
        time,
        accountability,
        commitment,
      ]
    );

  const openLearning =
    () => {
      router.push({
        pathname:
          "/learning",

        params:
          navigationParams,
      } as any);
    };

  const openAction =
    () => {
      router.push({
        pathname:
          "/action",

        params:
          navigationParams,
      } as any);
    };

  const openSkillTree =
    () => {
      router.push({
        pathname:
          "/skilltree",

        params:
          navigationParams,
      } as any);
    };

  // ==========================================================
  // LABEL
  // ==========================================================

  const goalLabel =
    progressSummary.currentGoalLabel ||
    "Personal";

  // ==========================================================
  // RENDER TODAY
  // ==========================================================

  const renderToday =
    () => (
      <>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>
              RISE
            </Text>

            <Text style={styles.headerTitle}>
              Today
            </Text>
          </View>

          <View style={styles.coinBadge}>
            <Text style={styles.coinEmoji}>
              🪙
            </Text>

            <Text style={styles.coinText}>
              {progress.coins}
            </Text>
          </View>
        </View>

        <View style={styles.goalCard}>
          <View style={styles.goalCardTop}>
            <View>
              <Text style={styles.cardEyebrow}>
                YOUR CURRENT PATH
              </Text>

              <Text style={styles.goalTitle}>
                {goalLabel}
              </Text>
            </View>

            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>
                LVL {progress.level}
              </Text>
            </View>
          </View>

          <View style={styles.xpRow}>
            <Text style={styles.xpCurrent}>
              {progress.totalXP} XP
            </Text>

            <Text style={styles.xpTarget}>
              {progressSummary.xpToNextLevel} XP
              {" "}to next level
            </Text>
          </View>

          <View style={styles.progressBackground}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.round(
                    progressSummary.progressPercent *
                      100
                  )}%`,
                },
              ]}
            />
          </View>

          <Text style={styles.goalFooter}>
            {progressSummary.currentLevelXP} /{" "}
            {progressSummary.xpForNextLevel} XP
            {" · "}
            {Math.round(
              progressSummary.progressPercent *
                100
            )}
            %
          </Text>
        </View>

        <Text style={styles.sectionTitle}>
          YOUR RISE PATH
        </Text>

        <View style={styles.pathCard}>
          {[
            ["📖", "LEARN"],
            ["🧠", "QUIZ"],
            ["⚡", "MISSION"],
            ["🛠️", "PROJECT"],
            ["📸", "PROOF"],
          ].map(
            ([emoji, label], index) => (
              <React.Fragment key={label}>
                <View style={styles.pathStep}>
                  <Text style={styles.pathEmoji}>
                    {emoji}
                  </Text>

                  <Text style={styles.pathLabel}>
                    {label}
                  </Text>
                </View>

                {index < 4 && (
                  <Text style={styles.pathArrow}>
                    →
                  </Text>
                )}
              </React.Fragment>
            )
          )}
        </View>

        <View style={styles.whyCard}>
          <Text style={styles.whyEyebrow}>
            WHY THIS?
          </Text>

          <Text style={styles.whyText}>
            {whyThis}
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              DAILY FOCUS
            </Text>

            <Text style={styles.sectionSubtitle}>
              {totalMinutes} min planned
              {" · "}
              {completedCount}/{tasks.length} complete
            </Text>
          </View>

          <Text style={styles.xpToday}>
            +{completedXP} XP
          </Text>
        </View>

        {selectedTask &&
          selectedTask.task && (
            <View style={styles.selectedTaskCard}>
              <Text style={styles.selectedEyebrow}>
                SELECTED MISSION
              </Text>

              <Text style={styles.selectedTitle}>
                {selectedTask.emoji || "⚡"}{" "}
                {selectedTask.title ||
                  "Your Mission"}
              </Text>

              <Text style={styles.selectedDescription}>
                {selectedTask.task}
              </Text>

              {selectedTask.duration && (
                <Text style={styles.selectedDuration}>
                  ⏱ {selectedTask.duration} minutes
                </Text>
              )}
            </View>
          )}

        {tasks.map((task) => {
          const completed =
            completedTasks.includes(
              task.id
            );

          const saving =
            savingTask === task.id;

          return (
            <View
              key={task.id}
              style={[
                styles.taskCard,
                completed &&
                  styles.completedTaskCard,
              ]}
            >
              <Pressable
                onPress={() =>
                  toggleTask(task)
                }
                disabled={saving}
                style={styles.taskMain}
              >
                <View
                  style={[
                    styles.checkCircle,
                    completed &&
                      styles.checkCircleCompleted,
                  ]}
                >
                  <Text
                    style={[
                      styles.checkText,
                      completed &&
                        styles.checkTextCompleted,
                    ]}
                  >
                    {saving
                      ? "…"
                      : completed
                      ? "✓"
                      : ""}
                  </Text>
                </View>

                <View style={styles.taskContent}>
                  <Text
                    style={[
                      styles.taskTitle,
                      completed &&
                        styles.completedTaskTitle,
                    ]}
                  >
                    {task.emoji} {task.title}
                  </Text>

                  <Text style={styles.taskDescription}>
                    {task.task}
                  </Text>

                  <View style={styles.taskMeta}>
                    <Text style={styles.durationText}>
                      ⏱ {task.duration} min
                    </Text>

                    <Text style={styles.rewardText}>
                      +{task.xp} XP
                    </Text>

                    <Text style={styles.rewardText}>
                      +{task.coins} 🪙
                    </Text>
                  </View>
                </View>
              </Pressable>

              <Pressable
                style={styles.proofButton}
                onPress={() =>
                  openProof(task)
                }
              >
                <Text style={styles.proofButtonText}>
                  Prove it +20
                </Text>
              </Pressable>
            </View>
          );
        })}

        <View style={styles.accountabilityCard}>
          <Text style={styles.accountabilityEmoji}>
            🔥
          </Text>

          <View style={styles.accountabilityContent}>
            <Text style={styles.accountabilityTitle}>
              {accountability}
            </Text>

            <Text style={styles.accountabilityText}>
              Your commitment: {commitment}.
              Show up today, then repeat tomorrow.
            </Text>
          </View>
        </View>

        <View style={styles.completionCard}>
          <Text style={styles.completionPercent}>
            {Math.round(
              completionProgress * 100
            )}
            %
          </Text>

          <View style={styles.completionContent}>
            <Text style={styles.completionTitle}>
              {completionProgress >= 1
                ? "Today's Plan Complete 🎉"
                : "Keep Going"}
            </Text>

            <Text style={styles.completionText}>
              {completionProgress >= 1
                ? "You completed everything RISE planned for today."
                : `${completedCount} of ${tasks.length} missions complete. Keep building your momentum.`}
            </Text>
          </View>
        </View>

        <Pressable
          style={styles.secondaryButton}
          onPress={openSkillTree}
        >
          <Text style={styles.secondaryButtonText}>
            View My Skill Tree →
          </Text>
        </Pressable>

        <Pressable
          style={styles.primaryButton}
          onPress={openAction}
        >
          <Text style={styles.primaryButtonText}>
            Start My Next Mission →
          </Text>
        </Pressable>

        <Pressable
          style={styles.learningButton}
          onPress={openLearning}
        >
          <Text style={styles.learningButtonText}>
            Continue Learning
          </Text>
        </Pressable>
      </>
    );

  // ==========================================================
  // PROGRESS TAB
  // ==========================================================

  const renderProgress =
    () => (
      <>
        <Text style={styles.tabPageTitle}>
          Your Progress
        </Text>

        <Text style={styles.tabPageSubtitle}>
          Every action adds to the person you're becoming.
        </Text>

        <View style={styles.bigProgressCard}>
          <Text style={styles.bigLevelLabel}>
            CURRENT LEVEL
          </Text>

          <Text style={styles.bigLevel}>
            {progress.level}
          </Text>

          <Text style={styles.bigXP}>
            {progress.totalXP} TOTAL XP
          </Text>

          <View style={styles.progressBackground}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.round(
                    progressSummary.progressPercent *
                      100
                  )}%`,
                },
              ]}
            />
          </View>

          <Text style={styles.bigProgressText}>
            {progressSummary.currentLevelXP} /{" "}
            {progressSummary.xpForNextLevel} XP
            {" "}to Level {progress.level + 1}
          </Text>
        </View>

        <View style={styles.statGrid}>
          <View style={styles.gridCard}>
            <Text style={styles.gridNumber}>
              {completedCount}
            </Text>

            <Text style={styles.gridLabel}>
              Today's Tasks
            </Text>
          </View>

          <View style={styles.gridCard}>
            <Text style={styles.gridNumber}>
              {completedXP}
            </Text>

            <Text style={styles.gridLabel}>
              Today's XP
            </Text>
          </View>

          <View style={styles.gridCard}>
            <Text style={styles.gridNumber}>
              {totalMinutes}
            </Text>

            <Text style={styles.gridLabel}>
              Minutes Planned
            </Text>
          </View>

          <View style={styles.gridCard}>
            <Text style={styles.gridNumber}>
              {progress.events.length}
            </Text>

            <Text style={styles.gridLabel}>
              Activities
            </Text>
          </View>
        </View>

        <Pressable
          style={styles.primaryButton}
          onPress={openSkillTree}
        >
          <Text style={styles.primaryButtonText}>
            Explore My Skill Tree →
          </Text>
        </Pressable>
      </>
    );

  // ==========================================================
  // COINS TAB
  // ==========================================================

  const renderCoins =
    () => (
      <>
        <Text style={styles.tabPageTitle}>
          Rise Coins
        </Text>

        <Text style={styles.tabPageSubtitle}>
          Your reward for taking consistent action.
        </Text>

        <View style={styles.coinsHero}>
          <Text style={styles.coinsHeroEmoji}>
            🪙
          </Text>

          <Text style={styles.coinsHeroNumber}>
            {progress.coins}
          </Text>

          <Text style={styles.coinsHeroLabel}>
            TOTAL RISE COINS
          </Text>
        </View>

        <View style={styles.coinStatsCard}>
          <View style={styles.coinStatRow}>
            <Text style={styles.coinStatLabel}>
              Today's earnings
            </Text>

            <Text style={styles.coinStatValue}>
              +{completedCoins} 🪙
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.coinStatRow}>
            <Text style={styles.coinStatLabel}>
              Completed tasks
            </Text>

            <Text style={styles.coinStatValue}>
              {completedCount}
            </Text>
          </View>
        </View>

        <View style={styles.coinInfoCard}>
          <Text style={styles.coinInfoTitle}>
            Keep rising.
          </Text>

          <Text style={styles.coinInfoText}>
            Rise Coins are earned through meaningful
            progress across RISE. Complete learning,
            missions, projects and proof to keep
            building your balance.
          </Text>
        </View>
      </>
    );

  // ==========================================================
  // PROFILE TAB
  // ==========================================================

  const renderProfile =
    () => (
      <>
        <Text style={styles.tabPageTitle}>
          My RISE Profile
        </Text>

        <Text style={styles.tabPageSubtitle}>
          Your current path and commitments.
        </Text>

        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>
              R
            </Text>
          </View>

          <Text style={styles.profileTitle}>
            {goalLabel}
          </Text>

          <Text style={styles.profileSubtitle}>
            RISE Level {progress.level}
          </Text>
        </View>

        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>
              Goals
            </Text>

            <Text style={styles.settingValue}>
              {selectedGoals.length || 1}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>
              Daily target
            </Text>

            <Text style={styles.settingValue}>
              {time}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>
              Accountability
            </Text>

            <Text style={styles.settingValue}>
              {accountability}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>
              Commitment
            </Text>

            <Text style={styles.settingValue}>
              {commitment}
            </Text>
          </View>
        </View>

        <View style={styles.profileStats}>
          <Text style={styles.profileStatsTitle}>
            YOUR STATS
          </Text>

          <Text style={styles.profileStatText}>
            ⭐ {progress.totalXP} XP
          </Text>

          <Text style={styles.profileStatText}>
            🪙 {progress.coins} Rise Coins
          </Text>

          <Text style={styles.profileStatText}>
            📈 Level {progress.level}
          </Text>

          <Text style={styles.profileStatText}>
            ⚡ {progress.events.length} activities
          </Text>
        </View>
      </>
    );

  // ==========================================================
  // BOTTOM NAV
  // ==========================================================

  const tabs = [
    {
      id: "today" as const,
      emoji: "☀️",
      label: "Today",
    },
    {
      id: "progress" as const,
      emoji: "📈",
      label: "Progress",
    },
    {
      id: "coins" as const,
      emoji: "🪙",
      label: "Coins",
    },
    {
      id: "profile" as const,
      emoji: "👤",
      label: "Profile",
    },
  ];

  // ==========================================================
  // MAIN
  // ==========================================================

  return (
    <View style={styles.screen}>
      <Animated.View
        style={{
          flex: 1,
          opacity: fadeAnim,
          transform: [
            {
              translateY: slideAnim,
            },
          ],
        }}
      >
        <ScrollView
          contentContainerStyle={
            styles.container
          }
          showsVerticalScrollIndicator={false}
        >
          {activeTab === "today" &&
            renderToday()}

          {activeTab === "progress" &&
            renderProgress()}

          {activeTab === "coins" &&
            renderCoins()}

          {activeTab === "profile" &&
            renderProfile()}

          <View style={styles.bottomSpace} />
        </ScrollView>
      </Animated.View>

      <View style={styles.bottomNav}>
        {tabs.map((tab) => {
          const active =
            activeTab === tab.id;

          return (
            <Pressable
              key={tab.id}
              style={[
                styles.navItem,
                active &&
                  styles.navItemActive,
              ]}
              onPress={() =>
                setActiveTab(tab.id)
              }
            >
              <Text style={styles.navEmoji}>
                {tab.emoji}
              </Text>

              <Text
                style={[
                  styles.navLabel,
                  active &&
                    styles.navLabelActive,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: "#010807",
    },

    container: {
      flexGrow: 1,
      paddingHorizontal: 20,
      paddingTop: 65,
      paddingBottom: 30,
    },

    bottomSpace: {
      height: 90,
    },

    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 22,
    },

    eyebrow: {
      color: "#7AF5B8",
      fontSize: 11,
      fontWeight: "900",
      letterSpacing: 2,
    },

    headerTitle: {
      color: "#F5FFF9",
      fontSize: 38,
      fontWeight: "900",
      marginTop: 3,
    },

    coinBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#071B16",
      borderWidth: 1,
      borderColor: "rgba(122,245,184,0.2)",
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 20,
    },

    coinEmoji: {
      fontSize: 17,
      marginRight: 6,
    },

    coinText: {
      color: "#7AF5B8",
      fontSize: 15,
      fontWeight: "900",
    },

    goalCard: {
      backgroundColor: "#071B16",
      borderRadius: 25,
      borderWidth: 1,
      borderColor: "rgba(122,245,184,0.2)",
      padding: 22,
      marginBottom: 25,
    },

    goalCardTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },

    cardEyebrow: {
      color: "#7AF5B8",
      fontSize: 10,
      fontWeight: "900",
      letterSpacing: 1.5,
    },

    goalTitle: {
      color: "#F5FFF9",
      fontSize: 27,
      fontWeight: "900",
      marginTop: 6,
    },

    levelBadge: {
      backgroundColor: "#0D2F22",
      borderRadius: 12,
      paddingHorizontal: 11,
      paddingVertical: 7,
    },

    levelBadgeText: {
      color: "#7AF5B8",
      fontSize: 11,
      fontWeight: "900",
    },

    xpRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 24,
      marginBottom: 8,
    },

    xpCurrent: {
      color: "#F5FFF9",
      fontWeight: "900",
    },

    xpTarget: {
      color: "#B4D4C2",
      fontSize: 11,
    },

    progressBackground: {
      height: 8,
      backgroundColor: "#1B2B26",
      borderRadius: 10,
      overflow: "hidden",
    },

    progressFill: {
      height: "100%",
      backgroundColor: "#7AF5B8",
      borderRadius: 10,
    },

    goalFooter: {
      color: "#8FAFA0",
      fontSize: 11,
      marginTop: 7,
    },

    sectionTitle: {
      color: "#7AF5B8",
      fontSize: 12,
      fontWeight: "900",
      letterSpacing: 1.5,
      marginBottom: 10,
    },

    sectionSubtitle: {
      color: "#78958A",
      fontSize: 12,
      marginTop: -4,
    },

    pathCard: {
      backgroundColor: "#071B16",
      borderRadius: 19,
      borderWidth: 1,
      borderColor: "rgba(122,245,184,0.15)",
      padding: 13,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 20,
    },

    pathStep: {
      alignItems: "center",
      flex: 1,
    },

    pathEmoji: {
      fontSize: 17,
    },

    pathLabel: {
      color: "#B4D4C2",
      fontSize: 7,
      fontWeight: "900",
      marginTop: 4,
      letterSpacing: 0.5,
    },

    pathArrow: {
      color: "#45675A",
      fontSize: 12,
      marginHorizontal: 1,
    },

    whyCard: {
      backgroundColor: "#0D2F22",
      borderRadius: 20,
      padding: 19,
      borderWidth: 1,
      borderColor: "rgba(122,245,184,0.15)",
      marginBottom: 25,
    },

    whyEyebrow: {
      color: "#7AF5B8",
      fontSize: 10,
      fontWeight: "900",
      letterSpacing: 1.5,
      marginBottom: 7,
    },

    whyText: {
      color: "#C8EED9",
      fontSize: 14,
      lineHeight: 21,
    },

    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
      marginBottom: 12,
    },

    xpToday: {
      color: "#7AF5B8",
      fontSize: 13,
      fontWeight: "900",
    },

    selectedTaskCard: {
      backgroundColor: "#0D2F22",
      borderRadius: 21,
      padding: 20,
      borderWidth: 1,
      borderColor: "rgba(122,245,184,0.25)",
      marginBottom: 12,
    },

    selectedEyebrow: {
      color: "#7AF5B8",
      fontSize: 10,
      fontWeight: "900",
      letterSpacing: 1.5,
    },

    selectedTitle: {
      color: "#F5FFF9",
      fontSize: 22,
      fontWeight: "900",
      marginTop: 8,
    },

    selectedDescription: {
      color: "#C8EED9",
      fontSize: 14,
      lineHeight: 21,
      marginTop: 7,
    },

    selectedDuration: {
      color: "#7AF5B8",
      fontWeight: "800",
      marginTop: 12,
    },

    taskCard: {
      backgroundColor: "#071B16",
      borderRadius: 20,
      borderWidth: 1,
      borderColor: "rgba(122,245,184,0.15)",
      padding: 16,
      marginBottom: 12,
    },

    completedTaskCard: {
      borderColor: "rgba(122,245,184,0.35)",
      backgroundColor: "#082118",
    },

    taskMain: {
      flexDirection: "row",
      alignItems: "flex-start",
    },

    checkCircle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: "#4A665B",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
      marginTop: 2,
    },

    checkCircleCompleted: {
      backgroundColor: "#7AF5B8",
      borderColor: "#7AF5B8",
    },

    checkText: {
      color: "#010807",
      fontSize: 15,
      fontWeight: "900",
    },

    checkTextCompleted: {
      color: "#010807",
    },

    taskContent: {
      flex: 1,
    },

    taskTitle: {
      color: "#F5FFF9",
      fontSize: 17,
      fontWeight: "900",
    },

    completedTaskTitle: {
      textDecorationLine: "line-through",
      color: "#89A79A",
    },

    taskDescription: {
      color: "#AFCBBC",
      fontSize: 13,
      lineHeight: 19,
      marginTop: 5,
    },

    taskMeta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginTop: 10,
    },

    durationText: {
      color: "#8CA99D",
      fontSize: 11,
      fontWeight: "700",
    },

    rewardText: {
      color: "#7AF5B8",
      fontSize: 11,
      fontWeight: "900",
    },

    proofButton: {
      marginTop: 14,
      alignSelf: "flex-start",
      borderWidth: 1,
      borderColor: "rgba(122,245,184,0.25)",
      borderRadius: 15,
      paddingHorizontal: 13,
      paddingVertical: 8,
    },

    proofButtonText: {
      color: "#7AF5B8",
      fontSize: 11,
      fontWeight: "900",
    },

    accountabilityCard: {
      flexDirection: "row",
      backgroundColor: "#071B16",
      borderRadius: 20,
      borderWidth: 1,
      borderColor: "rgba(122,245,184,0.15)",
      padding: 18,
      marginTop: 12,
      marginBottom: 15,
    },

    accountabilityEmoji: {
      fontSize: 25,
      marginRight: 12,
    },

    accountabilityContent: {
      flex: 1,
    },

    accountabilityTitle: {
      color: "#F5FFF9",
      fontSize: 15,
      fontWeight: "900",
    },

    accountabilityText: {
      color: "#AFCBBC",
      fontSize: 12,
      lineHeight: 18,
      marginTop: 4,
    },

    completionCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#0D2F22",
      borderRadius: 21,
      padding: 18,
      marginBottom: 20,
    },

    completionPercent: {
      color: "#7AF5B8",
      fontSize: 30,
      fontWeight: "900",
      marginRight: 15,
    },

    completionContent: {
      flex: 1,
    },

    completionTitle: {
      color: "#F5FFF9",
      fontSize: 16,
      fontWeight: "900",
    },

    completionText: {
      color: "#B4D4C2",
      fontSize: 12,
      lineHeight: 18,
      marginTop: 3,
    },

    primaryButton: {
      backgroundColor: "#7AF5B8",
      borderRadius: 28,
      alignItems: "center",
      paddingVertical: 16,
      marginTop: 8,
    },

    primaryButtonText: {
      color: "#010807",
      fontSize: 15,
      fontWeight: "900",
    },

    secondaryButton: {
      backgroundColor: "#071B16",
      borderRadius: 28,
      borderWidth: 1,
      borderColor: "rgba(122,245,184,0.25)",
      alignItems: "center",
      paddingVertical: 15,
    },

    secondaryButtonText: {
      color: "#7AF5B8",
      fontSize: 14,
      fontWeight: "900",
    },

    learningButton: {
      alignItems: "center",
      paddingVertical: 17,
    },

    learningButtonText: {
      color: "#7AF5B8",
      fontSize: 14,
      fontWeight: "800",
    },

    tabPageTitle: {
      color: "#F5FFF9",
      fontSize: 34,
      fontWeight: "900",
      marginBottom: 7,
    },

    tabPageSubtitle: {
      color: "#AFCBBC",
      fontSize: 15,
      lineHeight: 21,
      marginBottom: 25,
    },

    bigProgressCard: {
      backgroundColor: "#071B16",
      borderRadius: 25,
      padding: 24,
      borderWidth: 1,
      borderColor: "rgba(122,245,184,0.2)",
      marginBottom: 15,
    },

    bigLevelLabel: {
      color: "#7AF5B8",
      fontSize: 10,
      fontWeight: "900",
      letterSpacing: 1.5,
    },

    bigLevel: {
      color: "#F5FFF9",
      fontSize: 62,
      fontWeight: "900",
      marginTop: 3,
    },

    bigXP: {
      color: "#B4D4C2",
      fontSize: 12,
      fontWeight: "800",
      marginBottom: 17,
    },

    bigProgressText: {
      color: "#8FAFA0",
      fontSize: 11,
      marginTop: 8,
    },

    statGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginBottom: 20,
    },

    gridCard: {
      width: "48%",
      backgroundColor: "#071B16",
      borderRadius: 18,
      borderWidth: 1,
      borderColor: "rgba(122,245,184,0.15)",
      padding: 18,
    },

    gridNumber: {
      color: "#7AF5B8",
      fontSize: 25,
      fontWeight: "900",
    },

    gridLabel: {
      color: "#AFCBBC",
      fontSize: 11,
      marginTop: 4,
    },

    coinsHero: {
      backgroundColor: "#0D2F22",
      borderRadius: 27,
      alignItems: "center",
      padding: 35,
      borderWidth: 1,
      borderColor: "rgba(122,245,184,0.2)",
      marginBottom: 15,
    },

    coinsHeroEmoji: {
      fontSize: 40,
    },

    coinsHeroNumber: {
      color: "#F5FFF9",
      fontSize: 50,
      fontWeight: "900",
      marginTop: 5,
    },

    coinsHeroLabel: {
      color: "#7AF5B8",
      fontSize: 10,
      fontWeight: "900",
      letterSpacing: 1.5,
      marginTop: 4,
    },

    coinStatsCard: {
      backgroundColor: "#071B16",
      borderRadius: 20,
      padding: 19,
      borderWidth: 1,
      borderColor: "rgba(122,245,184,0.15)",
    },

    coinStatRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 3,
    },

    coinStatLabel: {
      color: "#B4D4C2",
      fontSize: 13,
    },

    coinStatValue: {
      color: "#7AF5B8",
      fontSize: 14,
      fontWeight: "900",
    },

    divider: {
      height: 1,
      backgroundColor: "rgba(180,212,194,0.1)",
      marginVertical: 14,
    },

    coinInfoCard: {
      backgroundColor: "#071B16",
      borderRadius: 20,
      padding: 20,
      marginTop: 15,
      borderWidth: 1,
      borderColor: "rgba(122,245,184,0.15)",
    },

    coinInfoTitle: {
      color: "#F5FFF9",
      fontSize: 20,
      fontWeight: "900",
    },

    coinInfoText: {
      color: "#AFCBBC",
      fontSize: 13,
      lineHeight: 20,
      marginTop: 6,
    },

    profileCard: {
      backgroundColor: "#0D2F22",
      borderRadius: 25,
      alignItems: "center",
      padding: 28,
      borderWidth: 1,
      borderColor: "rgba(122,245,184,0.2)",
      marginBottom: 15,
    },

    profileAvatar: {
      width: 65,
      height: 65,
      borderRadius: 33,
      backgroundColor: "#7AF5B8",
      alignItems: "center",
      justifyContent: "center",
    },

    profileAvatarText: {
      color: "#010807",
      fontSize: 30,
      fontWeight: "900",
    },

    profileTitle: {
      color: "#F5FFF9",
      fontSize: 24,
      fontWeight: "900",
      marginTop: 12,
    },

    profileSubtitle: {
      color: "#7AF5B8",
      fontSize: 12,
      fontWeight: "800",
      marginTop: 4,
    },

    settingsCard: {
      backgroundColor: "#071B16",
      borderRadius: 20,
      padding: 19,
      borderWidth: 1,
      borderColor: "rgba(122,245,184,0.15)",
      marginBottom: 15,
    },

    settingRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 20,
    },

    settingLabel: {
      color: "#8FAFA0",
      fontSize: 12,
    },

    settingValue: {
      color: "#F5FFF9",
      fontSize: 12,
      fontWeight: "800",
      textAlign: "right",
      flex: 1,
    },

    profileStats: {
      backgroundColor: "#071B16",
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: "rgba(122,245,184,0.15)",
    },

    profileStatsTitle: {
      color: "#7AF5B8",
      fontSize: 11,
      fontWeight: "900",
      letterSpacing: 1.5,
      marginBottom: 12,
    },

    profileStatText: {
      color: "#C8EED9",
      fontSize: 14,
      marginBottom: 9,
    },

    bottomNav: {
      position: "absolute",
      left: 12,
      right: 12,
      bottom: 12,
      height: 67,
      backgroundColor: "#071B16",
      borderRadius: 23,
      borderWidth: 1,
      borderColor: "rgba(122,245,184,0.2)",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-around",
      paddingHorizontal: 6,
    },

    navItem: {
      flex: 1,
      height: 55,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
    },

    navItemActive: {
      backgroundColor: "#0D2F22",
    },

    navEmoji: {
      fontSize: 17,
    },

    navLabel: {
      color: "#6E8C80",
      fontSize: 9,
      fontWeight: "800",
      marginTop: 3,
    },

    navLabelActive: {
      color: "#7AF5B8",
    },
  });
