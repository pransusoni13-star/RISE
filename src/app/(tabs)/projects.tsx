import React, { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { AppPageHeader } from "../../components/appPageHeader";
import { loadProfile, RiseProfile } from "../../services/personalization";
import { getProjectIdeaLevels, ProjectDifficulty } from "../../services/projectIdeas";
import { useRiseAppearance } from "../../services/appearance";

export default function ProjectsTabScreen() {
  const { theme } = useRiseAppearance();
  const [profile, setProfile] = useState<RiseProfile | null>(null);
  useFocusEffect(useCallback(() => { let active = true; void loadProfile().then((value) => { if (active) setProfile(value); }); return () => { active = false; }; }, []));
  const storedGoals = profile?.selectedGoals?.length ? profile.selectedGoals : ["personal"];
  const primaryGoal = storedGoals[0];
  const focusSkill = profile?.weeklySkill || profile?.focusSkills?.[0];
  const levels = useMemo(() => getProjectIdeaLevels(primaryGoal, focusSkill), [primaryGoal, focusSkill]);

  const projects = useMemo(
    () => (["Easy", "Medium", "Hard", "Insane"] as ProjectDifficulty[]).map((difficulty, index) => ({
      ...levels[difficulty], difficulty, emoji: ["🌱", "⚡", "🚀", "🔥"][index], color: ["#7AF5B8", "#63B3FF", "#FFB35C", "#FF718B"][index],
    })),
    [levels]
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <AppPageHeader />
      <Text style={[styles.heading, { color: theme.text }]}>Build something 🛠️</Text>
      <Text style={[styles.subtitle, { color: theme.muted }]}>Choose a specific idea for {focusSkill || primaryGoal.replace(/-/g, " ")}. RISE gives you the result, steps, and proof.</Text>

      {projects.map((project) => (
        <Pressable
          key={project.title}
          style={({ pressed }) => [styles.card, { backgroundColor: theme.surface, borderColor: project.color }, pressed && styles.pressed]}
          onPress={() =>
            router.push({
              pathname: "/project",
              params: {
                difficulty: project.difficulty,
                goals: JSON.stringify(
                  storedGoals.length ? storedGoals : ["personal"]
                ),
                focusSkill: focusSkill || "",
              },
            } as any)
          }
        >
          <View style={styles.projectTop}><Text style={styles.projectEmoji}>{project.emoji}</Text><Text style={[styles.difficulty, { color: project.color }]}>{project.difficulty.toUpperCase()}</Text></View>
          <Text style={[styles.cardTitle, { color: theme.text }]}>{project.title}</Text>
          <Text style={[styles.cardDescription, { color: theme.muted }]}>{project.description}</Text>
          <Text style={[styles.ideasLabel, { color: theme.muted }]}>PICK ONE IDEA</Text>
          {project.examples.map((example) => <Text key={example} style={[styles.idea, { color: theme.text }]}>• {example}</Text>)}
          <View style={styles.row}>
            <Text style={styles.meta}>Proof required</Text>
            <Text style={[styles.reward, { color: project.color }]}>Start →</Text>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#010807",
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 68,
    paddingBottom: 120,
  },
  logo: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 5,
    color: "#7AF5B8",
    marginBottom: 20,
  },
  heading: {
    fontSize: 34,
    fontWeight: "900",
    color: "#F5FFF9",
    marginBottom: 8,
  },
  subtitle: {
    color: "#C8EED9",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#071B16",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "#1E3A31",
    marginBottom: 13,
  },
  projectTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  projectEmoji: { fontSize: 25 },
  difficulty: { fontSize: 10, fontWeight: "900", letterSpacing: 1.4 },
  cardTitle: {
    color: "#F5FFF9",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 6,
  },
  cardDescription: {
    color: "#C8EED9",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 11,
  },
  ideasLabel: { color: "#8FB6A2", fontSize: 9, fontWeight: "900", letterSpacing: 1.1, marginBottom: 5 },
  idea: { color: "#E1F7EA", fontSize: 12, lineHeight: 18, fontWeight: "700" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  meta: {
    color: "#B4D4C2",
    fontSize: 12,
    fontWeight: "700",
  },
  reward: {
    color: "#7AF5B8",
    fontSize: 14,
    fontWeight: "900",
  },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
});
