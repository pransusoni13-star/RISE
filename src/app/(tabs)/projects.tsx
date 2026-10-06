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
        title: "Starter project",
        description: "Easy · Finish one focused result with a clear before-and-after example.",
        difficulty: "Easy",
      },
      {
        title: "Practical project",
        description: "Medium · Combine several skills into a useful result and get one person’s feedback.",
        difficulty: "Medium",
      },
      {
        title: "Launch Challenge",
        description: "Hard · Build, test, revise, and explain a multi-step real-world outcome.",
        difficulty: "Hard",
      },
      {
        title: "Insane capstone",
        description: "Insane · Launch a complete result, measure real use, document limitations, and ship an evidence-based revision.",
        difficulty: "Insane",
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
      <Text style={styles.heading}>Projects</Text>
      <Text style={styles.subtitle}>Turn your learning into visible results that build confidence.</Text>

      {projects.map((project) => (
        <Pressable
          key={project.title}
          style={styles.card}
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
          <Text style={styles.cardTitle}>{project.title}</Text>
          <Text style={styles.cardDescription}>{project.description}</Text>
          <View style={styles.row}>
            <Text style={styles.meta}>Build + share</Text>
            <Text style={styles.reward}>{project.difficulty} · Proof required</Text>
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
    padding: 24,
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
    marginBottom: 24,
  },
  card: {
    backgroundColor: "#071B16",
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: "#1E3A31",
    marginBottom: 16,
  },
  cardTitle: {
    color: "#F5FFF9",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 8,
  },
  cardDescription: {
    color: "#C8EED9",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
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
});
