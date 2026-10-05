import { Tabs, router } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { hasCompletedRequiredTour } from "../../services/tourState";

const icon = (emoji: string) => <Text style={{ fontSize: 19, lineHeight: 25 }} accessibilityElementsHidden>{emoji}</Text>;

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const [tourReady, setTourReady] = useState(false);

  useEffect(() => {
    let active = true;
    void hasCompletedRequiredTour().then((complete) => {
      if (!active) return;
      if (!complete) {
        router.replace({ pathname: "/tour", params: { required: "1" } } as never);
        return;
      }
      setTourReady(true);
    });
    return () => { active = false; };
  }, []);

  if (!tourReady) return <View style={styles.loading}><ActivityIndicator color="#7AF5B8" /></View>;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#071B16",
          borderTopColor: "#1E3A31",
          borderTopWidth: 1,
          height: 64 + Math.max(insets.bottom, 10),
          paddingBottom: Math.max(insets.bottom, 10),
          paddingTop: 8,
        },
        tabBarActiveTintColor: "#7AF5B8",
        tabBarInactiveTintColor: "#B4D4C2",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "800",
        },
      }}
    >
      <Tabs.Screen
        name="today"
        options={{
          title: "Today",
          tabBarLabel: "Today",
          tabBarIcon: () => icon("☀️"),
        }}
      />

      <Tabs.Screen
        name="learn"
        options={{
          title: "Learn",
          tabBarLabel: "Learn",
          tabBarIcon: () => icon("📖"),
        }}
      />

      <Tabs.Screen
        name="missions"
        options={{
          title: "Missions",
          tabBarLabel: "Missions",
          tabBarIcon: () => icon("🎯"),
        }}
      />

      <Tabs.Screen
        name="projects"
        options={{
          title: "Projects",
          tabBarLabel: "Projects",
          tabBarIcon: () => icon("🛠️"),
        }}
      />

      <Tabs.Screen
        name="progress"
        options={{
          title: "Progress",
          tabBarLabel: "Progress",
          tabBarIcon: () => icon("📈"),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({ loading: { flex: 1, backgroundColor: "#010807", alignItems: "center", justifyContent: "center" } });
