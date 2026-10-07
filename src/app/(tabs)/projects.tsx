import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { AppPageHeader } from "../../components/appPageHeader";

const STORAGE_KEY = "RISE_SELECTED_GOALS";

export default function ProjectsTabScreen() {
  const [storedGoals, setStoredGoals] = useState<string[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadGoals = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);

        if (!saved || !isMounted) {
          return;
        }

        const parsedGoals = JSON.parse(saved) as string[];
        setStoredGoals(Array.isArray(parsedGoals) ? parsedGoals.filter((goal) => typeof goal === "string" && goal.trim()) : []);
      } catch (error) {
        console.log("Could not load selected goals:", error);
      }
    };

    loadGoals();

    return () => {
      isMounted = false;
    };
  }, []);

  const projects = useMemo(
    () => [
      {
        emoji: "🌱",
        title: "Quick win",
        description: "Finish one useful result today.",
        difficulty: "Easy",
        color: "#7AF5B8",
      },
      {
        emoji: "⚡",
        title: "Real challenge",
        description: "Combine skills and get one person’s feedback.",
        difficulty: "Medium",
        color: "#63B3FF",
      },
      {
        emoji: "🚀",
        title: "Launch it",
        description: "Build, test, improve, and share.",
        difficulty: "Hard",
        color: "#FFB35C",
      },
      {
        emoji: "🔥",
        title: "Go all in",
        description: "Launch, measure real use, and ship a better version.",
        difficulty: "Insane",
        color: "#FF718B",
      },
    ],
    []
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <AppPageHeader />
      <Text style={styles.heading}>Build something 🛠️</Text>
      <Text style={styles.subtitle}>Pick your challenge. Make it real.</Text>

      {projects.map((project) => (
        <Pressable
          key={project.title}
          style={({ pressed }) => [styles.card, { borderColor: project.color }, pressed && styles.pressed]}
          onPress={() =>
            router.push({
              pathname: "/project",
              params: {
                difficulty: project.difficulty,
                goals: JSON.stringify(
                  storedGoals.length ? storedGoals : ["personal"]
                ),
              },
            } as any)
          }
        >
          <View style={styles.projectTop}><Text style={styles.projectEmoji}>{project.emoji}</Text><Text style={[styles.difficulty, { color: project.color }]}>{project.difficulty.toUpperCase()}</Text></View>
          <Text style={styles.cardTitle}>{project.title}</Text>
          <Text style={styles.cardDescription}>{project.description}</Text>
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
    marginBottom: 14,
  },
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
