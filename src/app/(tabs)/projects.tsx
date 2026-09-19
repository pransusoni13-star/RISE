import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

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
        setStoredGoals(parsedGoals);
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
        title: "Mini Portfolio",
        description: "Package a visible result you can share with others.",
        reward: 180,
      },
      {
        title: "Proof of Work",
        description: "Create something concrete that demonstrates your growth.",
        reward: 220,
      },
      {
        title: "Launch Challenge",
        description: "Put your learning into a real-world, public-facing outcome.",
        reward: 300,
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
      <Text style={styles.logo}>RISE</Text>
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
                goals: JSON.stringify(
                  storedGoals.length ? storedGoals : ["coding"]
                ),
              },
            } as any)
          }
        >
          <Text style={styles.cardTitle}>{project.title}</Text>
          <Text style={styles.cardDescription}>{project.description}</Text>
          <View style={styles.row}>
            <Text style={styles.meta}>Build + share</Text>
            <Text style={styles.reward}>+{project.reward} XP</Text>
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
