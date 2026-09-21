import React, {
  useCallback,
  useMemo,
  useState,
} from "react";

import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  router,
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";

import {
  RISEProgress,
  buildSkillTreeForGoal,
  createDefaultProgress,
  getAdaptiveSummary,
  getSkillProgress,
  progressRepository,
} from "../services/progressEngine";

// ============================================================
// TYPES
// ============================================================

type SkillStatus =
  | "mastered"
  | "current"
  | "locked";

type DisplaySkill = {
  id: string;
  name: string;
  description: string;
  level: number;
  xp: number;
  requiredXP: number;
  status: SkillStatus;
};

// ============================================================
// SCREEN
// ============================================================

export default function SkillTreeScreen() {
  const params = useLocalSearchParams();

  const [progress, setProgress] =
    useState<RISEProgress>(
      createDefaultProgress()
    );

  const [refreshing, setRefreshing] =
    useState(false);

  // ==========================================================
  // LOAD PROGRESS
  // ==========================================================

  const loadProgress = useCallback(async () => {
    try {
      const storedProgress =
        await progressRepository.load();

      setProgress(
        storedProgress ||
          createDefaultProgress()
      );
    } catch (error) {
      console.warn(
        "RISE: Failed to load progress",
        error
      );

      setProgress(
        createDefaultProgress()
      );
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProgress();
    }, [loadProgress])
  );

  // ==========================================================
  // REFRESH
  // ==========================================================

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      await loadProgress();
    } finally {
      setRefreshing(false);
    }
  }, [loadProgress]);

  // ==========================================================
  // GOALS
  // ==========================================================

  const selectedGoals = useMemo<string[]>(() => {
    try {
      if (!params.goals) {
        return ["personal"];
      }

      const rawGoals =
        Array.isArray(params.goals)
          ? params.goals[0]
          : params.goals;

      const parsed = JSON.parse(
        String(rawGoals)
      );

      if (
        !Array.isArray(parsed) ||
        parsed.length === 0
      ) {
        return ["personal"];
      }

      const cleaned = parsed
        .map((goal) =>
          String(goal)
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "-")
        )
        .filter(Boolean);

      return cleaned.length
        ? cleaned
        : ["personal"];
    } catch {
      return ["personal"];
    }
  }, [params.goals]);

  const primaryGoal =
    selectedGoals[0] || "personal";

  // ==========================================================
  // BUILD SKILL TREE
  // ==========================================================

  const skills = useMemo<DisplaySkill[]>(() => {
    const goalSkills =
      buildSkillTreeForGoal(
        primaryGoal,
        progress
      );

    return goalSkills.map(
      (skill, index) => {
        const xp = Math.max(
          0,
          Number(skill.xp) || 0
        );

        const requiredXP = Math.max(
          1,
          Number(skill.requiredXP) || 1
        );

        const level = Math.max(
          1,
          Number(skill.level) || 1
        );

        const isMastered =
          xp >= requiredXP;

        let status: SkillStatus;

        const priorSkillsAreMastered = goalSkills
          .slice(0, index)
          .every((priorSkill) =>
            Math.max(0, Number(priorSkill.xp) || 0) >=
            Math.max(1, Number(priorSkill.requiredXP) || 1)
          );

        if (isMastered) {
          status = "mastered";
        } else if (priorSkillsAreMastered) {
          status = "current";
        } else {
          status = "locked";
        }

        return {
          id:
            skill.id ||
            `skill-${index}`,
          name:
            skill.name ||
            "Untitled Skill",
          description:
            skill.description ||
            "Continue developing this skill.",
          level,
          xp,
          requiredXP,
          status,
        };
      }
    );
  }, [primaryGoal, progress]);

  // ==========================================================
  // CURRENT SKILL
  // ==========================================================

  const currentSkill = useMemo(() => {
    return (
      skills.find(
        (skill) =>
          skill.status === "current"
      ) ||
      skills.find(
        (skill) =>
          skill.status !== "mastered"
      ) ||
      null
    );
  }, [skills]);

  // ==========================================================
  // NEXT SKILL
  // ==========================================================

  const nextSkill = useMemo(() => {
    if (!currentSkill) {
      return null;
    }

    const currentIndex =
      skills.findIndex(
        (skill) =>
          skill.id === currentSkill.id
      );

    if (currentIndex === -1) {
      return null;
    }

    return (
      skills[currentIndex + 1] ||
      null
    );
  }, [skills, currentSkill]);

  // ==========================================================
  // FULL MASTERY
  // ==========================================================

  const allSkillsMastered = useMemo(
    () =>
      skills.length > 0 &&
      skills.every(
        (skill) =>
          skill.status === "mastered"
      ),
    [skills]
  );

  // ==========================================================
  // STATS
  // ==========================================================

  const totalSkillXP = useMemo(
    () =>
      skills.reduce(
        (sum, skill) =>
          sum + skill.xp,
        0
      ),
    [skills]
  );

  const masteredCount = useMemo(
    () =>
      skills.filter(
        (skill) =>
          skill.status === "mastered"
      ).length,
    [skills]
  );

  const overallProgress = useMemo(() => {
    if (!skills.length) {
      return 0;
    }

    const total = skills.reduce(
      (sum, skill) =>
        sum +
        getSkillProgress({
          id: skill.id,
          name: skill.name,
          description:
            skill.description,
          xp: skill.xp,
          requiredXP:
            skill.requiredXP,
          level: skill.level,
          goal: primaryGoal,
        }),
      0
    );

    return Math.round(
      total / skills.length
    );
  }, [skills, primaryGoal]);

  // ==========================================================
  // CURRENT SKILL PROGRESS
  // ==========================================================

  const currentPercentage =
    currentSkill
      ? getSkillProgress({
          id: currentSkill.id,
          name: currentSkill.name,
          description:
            currentSkill.description,
          xp: currentSkill.xp,
          requiredXP:
            currentSkill.requiredXP,
          level: currentSkill.level,
          goal: primaryGoal,
        })
      : 0;

  // ==========================================================
  // ADAPTIVE ENGINE
  // ==========================================================

  const adaptiveSummary = useMemo(
    () =>
      getAdaptiveSummary(
        progress,
        selectedGoals
      ),
    [progress, selectedGoals]
  );

  // ==========================================================
  // GOAL LABEL
  // ==========================================================

  const goalLabel = useMemo(() => {
    return (
      primaryGoal
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (letter) =>
          letter.toUpperCase()
        ) || "Personal"
    );
  }, [primaryGoal]);

  // ==========================================================
  // NAVIGATION
  // ==========================================================

  const navigationParams = useMemo(
    () => ({
      goals:
        typeof params.goals === "string"
          ? params.goals
          : JSON.stringify(selectedGoals),

      goal: primaryGoal,

      time:
        typeof params.time === "string"
          ? params.time
          : "30–60 minutes",

      accountability:
        typeof params.accountability === "string"
          ? params.accountability
          : "Keep me consistent",

      commitment:
        typeof params.commitment === "string"
          ? params.commitment
          : "30 days",
    }),
    [
      params.goals,
      params.time,
      params.accountability,
      params.commitment,
      selectedGoals,
      primaryGoal,
    ]
  );

  // ==========================================================
  // OPEN NEXT MISSION
  // ==========================================================

  const openNextAction =
    useCallback(() => {
      router.push({
        pathname: "/action",
        params: {
          ...navigationParams,
          skillId:
            currentSkill?.id ||
            "foundations",
        },
      } as any);
    }, [
      navigationParams,
      currentSkill,
    ]);

  // ==========================================================
  // OPEN LEARNING
  // ==========================================================

  const openLearning =
    useCallback(() => {
      router.push({
        pathname: "/learning",
        params: {
          ...navigationParams,
          skillId:
            currentSkill?.id ||
            "foundations",
        },
      } as any);
    }, [
      navigationParams,
      currentSkill,
    ]);

  // ==========================================================
  // STATUS
  // ==========================================================

  const getStatusText = (
    status: SkillStatus
  ) => {
    if (status === "mastered") {
      return "MASTERED";
    }

    if (status === "current") {
      return "IN PROGRESS";
    }

    return "LOCKED";
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <ScrollView
      contentContainerStyle={
        styles.container
      }
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#7AF5B8"
        />
      }
    >
      <Text style={styles.eyebrow}>
        RISE SKILL SYSTEM
      </Text>

      <Text style={styles.title}>
        Your Skill Tree
      </Text>

      <Text style={styles.subtitle}>
        RISE tracks what you know,
        what you need to improve,
        and what you should master
        next.
      </Text>

      {/* CURRENT FOCUS */}

      {currentSkill && (
        <View
          style={styles.overviewCard}
        >
          <Text
            style={styles.overviewLabel}
          >
            CURRENT FOCUS
          </Text>

          <Text style={styles.focusTitle}>
            {currentSkill.name}
          </Text>

          <Text
            style={styles.focusDescription}
          >
            {currentSkill.description}
          </Text>

          <View style={styles.levelRow}>
            <Text style={styles.levelText}>
              Level {currentSkill.level}
            </Text>

            <Text style={styles.xpText}>
              {currentSkill.xp} /{" "}
              {currentSkill.requiredXP} XP
            </Text>
          </View>

          <View
            style={
              styles.progressBackground
            }
          >
            <View
              style={[
                styles.progressFill,
                {
                  width: `${currentPercentage}%`,
                },
              ]}
            />
          </View>

          <Text style={styles.mastery}>
            {currentPercentage}% toward
            mastery
          </Text>
        </View>
      )}

      {/* STATS */}

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text
            style={styles.statNumber}
          >
            {skills.length}
          </Text>

          <Text style={styles.statLabel}>
            Skills
          </Text>
        </View>

        <View style={styles.statCard}>
          <Text
            style={styles.statNumber}
          >
            {totalSkillXP}
          </Text>

          <Text style={styles.statLabel}>
            Skill XP
          </Text>
        </View>

        <View style={styles.statCard}>
          <Text
            style={styles.statNumber}
          >
            {masteredCount}
          </Text>

          <Text style={styles.statLabel}>
            Mastered
          </Text>
        </View>
      </View>

      {/* PATH */}

      <Text style={styles.sectionTitle}>
        YOUR {goalLabel.toUpperCase()} PATH
      </Text>

      {skills.map((skill, index) => {
        const percentage =
          getSkillProgress({
            id: skill.id,
            name: skill.name,
            description:
              skill.description,
            xp: skill.xp,
            requiredXP:
              skill.requiredXP,
            level: skill.level,
            goal: primaryGoal,
          });

        const isLocked =
          skill.status === "locked";

        const isMastered =
          skill.status === "mastered";

        return (
          <View
            key={`${primaryGoal}-${skill.id}`}
            style={[
              styles.skillCard,
              isLocked &&
                styles.lockedCard,
              isMastered &&
                styles.masteredCard,
            ]}
          >
            <View
              style={styles.skillTop}
            >
              <View
                style={[
                  styles.skillNumber,
                  isLocked &&
                    styles.lockedNumber,
                  isMastered &&
                    styles.masteredNumber,
                ]}
              >
                <Text
                  style={[
                    styles.skillNumberText,
                    isLocked &&
                      styles.lockedNumberText,
                  ]}
                >
                  {isLocked
                    ? "🔒"
                    : isMastered
                    ? "✓"
                    : index + 1}
                </Text>
              </View>

              <View
                style={styles.skillMain}
              >
                <Text
                  style={styles.skillName}
                >
                  {skill.name}
                </Text>

                <Text
                  style={
                    styles.skillDescription
                  }
                >
                  {skill.description}
                </Text>
              </View>

              <Text
                style={[
                  styles.status,
                  skill.status ===
                    "current" &&
                    styles.currentStatus,
                  isMastered &&
                    styles.masteredStatus,
                  isLocked &&
                    styles.lockedStatus,
                ]}
              >
                {getStatusText(
                  skill.status
                )}
              </Text>
            </View>

            {!isLocked ? (
              <>
                <View
                  style={
                    styles.skillLevelRow
                  }
                >
                  <Text
                    style={
                      styles.skillLevel
                    }
                  >
                    Level {skill.level}
                  </Text>

                  <Text
                    style={styles.skillXP}
                  >
                    {skill.xp}/
                    {skill.requiredXP} XP
                  </Text>
                </View>

                <View
                  style={
                    styles.smallProgressBackground
                  }
                >
                  <View
                    style={[
                      styles.smallProgressFill,
                      {
                        width: `${percentage}%`,
                      },
                    ]}
                  />
                </View>
              </>
            ) : (
              <Text
                style={styles.unlockText}
              >
                Master the previous
                skill to unlock this.
              </Text>
            )}
          </View>
        );
      })}

      {/* NEXT UNLOCK */}

      {nextSkill && !allSkillsMastered && (
        <View style={styles.nextCard}>
          <Text
            style={styles.nextEyebrow}
          >
            NEXT UNLOCK
          </Text>

          <Text style={styles.nextTitle}>
            {nextSkill.name}
          </Text>

          <Text
            style={styles.nextDescription}
          >
            {nextSkill.description}
          </Text>

          {currentSkill && (
            <Text
              style={
                styles.nextRequirement
              }
            >
              Continue building{" "}
              {currentSkill.name} to
              unlock your next skill.
            </Text>
          )}
        </View>
      )}

      {/* COMPLETE */}

      {allSkillsMastered && (
        <View
          style={styles.masteryCard}
        >
          <Text
            style={styles.masteryEmoji}
          >
            🏆
          </Text>

          <Text
            style={styles.masteryTitle}
          >
            Skill Path Complete
          </Text>

          <Text
            style={styles.masteryText}
          >
            You have mastered every
            skill currently available
            in this path. RISE can now
            move you toward deeper
            projects, assessments,
            and advanced challenges.
          </Text>
        </View>
      )}

      {/* ADAPTIVE ENGINE */}

      <View
        style={styles.adaptiveCard}
      >
        <Text
          style={styles.adaptiveEmoji}
        >
          🧠
        </Text>

        <View
          style={styles.adaptiveContent}
        >
          <Text
            style={styles.adaptiveTitle}
          >
            {goalLabel.toUpperCase()}{" "}
            ADAPTIVE ENGINE
          </Text>

          <Text
            style={styles.adaptiveText}
          >
            {
              adaptiveSummary
                .recommendation.title
            }
            {"\n"}
            {
              adaptiveSummary
                .recommendation
                .description
            }
          </Text>

          <View
            style={styles.momentumRow}
          >
            <Text
              style={styles.momentumLabel}
            >
              Momentum
            </Text>

            <Text
              style={styles.adaptiveMomentum}
            >
              {adaptiveSummary.momentum}
              {" · "}
              {overallProgress}%
            </Text>
          </View>
        </View>
      </View>

      {/* ACTION */}

      <Pressable
        style={({ pressed }) => [
          styles.actionButton,
          pressed &&
            styles.buttonPressed,
        ]}
        onPress={openNextAction}
      >
        <Text
          style={styles.actionButtonText}
        >
          Start My Next Mission →
        </Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          styles.learningButton,
          pressed &&
            styles.learningPressed,
        ]}
        onPress={openLearning}
      >
        <Text
          style={
            styles.learningButtonText
          }
        >
          Continue Learning
        </Text>
      </Pressable>

      <Text style={styles.footer}>
        LEARN → PROVE → DO → BUILD →
        RISE
      </Text>
    </ScrollView>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#010807",
    padding: 24,
    paddingTop: 70,
    paddingBottom: 50,
  },

  eyebrow: {
    color: "#7AF5B8",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 10,
  },

  title: {
    fontSize: 36,
    fontWeight: "900",
    color: "#F5FFF9",
  },

  subtitle: {
    color: "#C8EED9",
    fontSize: 16,
    lineHeight: 23,
    marginTop: 8,
    marginBottom: 25,
  },

  overviewCard: {
    backgroundColor: "#071B16",
    borderRadius: 24,
    borderWidth: 1,
    borderColor:
      "rgba(122,245,184,0.2)",
    padding: 23,
    marginBottom: 15,
  },

  overviewLabel: {
    color: "#7AF5B8",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  focusTitle: {
    color: "#FFFFFF",
    fontSize: 27,
    fontWeight: "900",
    marginTop: 12,
  },

  focusDescription: {
    color: "#C8EED9",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 7,
  },

  levelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 22,
    marginBottom: 8,
  },

  levelText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },

  xpText: {
    color: "#B4D4C2",
    fontWeight: "700",
  },

  progressBackground: {
    height: 9,
    backgroundColor: "#1B2B26",
    borderRadius: 10,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#7AF5B8",
    borderRadius: 10,
  },

  mastery: {
    color: "#B4D4C2",
    fontSize: 12,
    marginTop: 8,
  },

  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 30,
  },

  statCard: {
    flex: 1,
    backgroundColor: "#071B16",
    borderWidth: 1,
    borderColor:
      "rgba(122,245,184,0.18)",
    borderRadius: 18,
    padding: 16,
    alignItems: "center",
  },

  statNumber: {
    fontSize: 22,
    fontWeight: "900",
    color: "#F5FFF9",
  },

  statLabel: {
    color: "#B4D4C2",
    fontSize: 12,
    marginTop: 3,
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 12,
    color: "#7AF5B8",
  },

  skillCard: {
    backgroundColor: "#071B16",
    borderRadius: 20,
    borderWidth: 1,
    borderColor:
      "rgba(122,245,184,0.18)",
    padding: 17,
    marginBottom: 12,
  },

  lockedCard: {
    opacity: 0.6,
  },

  masteredCard: {
    borderColor:
      "rgba(122,245,184,0.3)",
  },

  skillTop: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  skillNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#7AF5B8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  lockedNumber: {
    backgroundColor: "#1B2B26",
  },

  masteredNumber: {
    backgroundColor: "#7AF5B8",
  },

  skillNumberText: {
    color: "#010807",
    fontWeight: "900",
  },

  lockedNumberText: {
    color: "#B4D4C2",
  },

  skillMain: {
    flex: 1,
    paddingRight: 5,
  },

  skillName: {
    fontSize: 17,
    fontWeight: "900",
    color: "#F5FFF9",
  },

  skillDescription: {
    color: "#B4D4C2",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },

  status: {
    fontSize: 9,
    fontWeight: "900",
    color: "#B4D4C2",
  },

  currentStatus: {
    color: "#7AF5B8",
  },

  masteredStatus: {
    color: "#7AF5B8",
  },

  lockedStatus: {
    color: "#8DA19B",
  },

  skillLevelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
    marginBottom: 7,
  },

  skillLevel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#F5FFF9",
  },

  skillXP: {
    fontSize: 12,
    color: "#B4D4C2",
  },

  smallProgressBackground: {
    height: 6,
    backgroundColor: "#1B2B26",
    borderRadius: 10,
    overflow: "hidden",
  },

  smallProgressFill: {
    height: "100%",
    backgroundColor: "#7AF5B8",
  },

  unlockText: {
    color: "#B4D4C2",
    fontSize: 12,
    marginTop: 15,
  },

  nextCard: {
    backgroundColor: "#0D2F22",
    borderRadius: 22,
    borderWidth: 1,
    borderColor:
      "rgba(122,245,184,0.2)",
    padding: 20,
    marginTop: 12,
    marginBottom: 18,
  },

  nextEyebrow: {
    color: "#7AF5B8",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  nextTitle: {
    fontSize: 23,
    fontWeight: "900",
    marginTop: 7,
    color: "#F5FFF9",
  },

  nextDescription: {
    color: "#C8EED9",
    lineHeight: 21,
    marginTop: 5,
  },

  nextRequirement: {
    color: "#7AF5B8",
    fontWeight: "800",
    fontSize: 13,
    marginTop: 12,
  },

  masteryCard: {
    backgroundColor: "#0D2F22",
    borderRadius: 22,
    borderWidth: 1,
    borderColor:
      "rgba(122,245,184,0.2)",
    padding: 20,
    marginBottom: 18,
    alignItems: "center",
  },

  masteryEmoji: {
    fontSize: 34,
    marginBottom: 8,
  },

  masteryTitle: {
    color: "#F5FFF9",
    fontSize: 22,
    fontWeight: "900",
  },

  masteryText: {
    color: "#C8EED9",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 8,
  },

  adaptiveCard: {
    flexDirection: "row",
    backgroundColor: "#071B16",
    borderRadius: 20,
    borderWidth: 1,
    borderColor:
      "rgba(122,245,184,0.18)",
    padding: 18,
    marginBottom: 20,
  },

  adaptiveEmoji: {
    fontSize: 27,
    marginRight: 12,
  },

  adaptiveContent: {
    flex: 1,
  },

  adaptiveTitle: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1,
    color: "#F5FFF9",
  },

  adaptiveText: {
    color: "#B4D4C2",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 5,
  },

  momentumRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },

  momentumLabel: {
    color: "#B4D4C2",
    fontSize: 12,
  },

  adaptiveMomentum: {
    color: "#7AF5B8",
    fontSize: 12,
    fontWeight: "900",
  },

  actionButton: {
    backgroundColor: "#7AF5B8",
    borderRadius: 30,
    paddingVertical: 17,
    alignItems: "center",
  },

  buttonPressed: {
    opacity: 0.75,
  },

  actionButtonText: {
    color: "#010807",
    fontSize: 17,
    fontWeight: "900",
  },

  learningButton: {
    alignItems: "center",
    paddingVertical: 18,
    marginTop: 6,
  },

  learningPressed: {
    opacity: 0.65,
  },

  learningButtonText: {
    fontWeight: "800",
    color: "#7AF5B8",
  },

  footer: {
    textAlign: "center",
    color: "#4F7465",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginTop: 18,
  },
});
