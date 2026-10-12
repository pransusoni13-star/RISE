import { Tabs, router } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { hasCompletedRequiredTour } from "../../services/tourState";
import { useRiseAppearance } from "../../services/appearance";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { theme } = useRiseAppearance();
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

  if (!tourReady) return <View style={[styles.loading, { backgroundColor: theme.background }]}><ActivityIndicator color={theme.accent} /></View>;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          height: 54 + Math.max(insets.bottom, 10),
          paddingBottom: Math.max(insets.bottom, 10),
          paddingTop: 10,
        },
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.muted,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "800",
        },
      }}
    >
      <Tabs.Screen
        name="today"
        options={{
          title: "Today",
          tabBarLabel: "Today",
          tabBarIcon: ({ focused }) => <View style={[styles.tabMarker, { backgroundColor: focused ? theme.accent : theme.muted }]} />,
        }}
      />

      <Tabs.Screen
        name="learn"
        options={{
          title: "Learn",
          tabBarLabel: "Learn",
          tabBarIcon: ({ focused }) => <View style={[styles.tabMarker, { backgroundColor: focused ? theme.accent : theme.muted }]} />,
        }}
      />

      <Tabs.Screen
        name="missions"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="projects"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="progress"
        options={{
          title: "Progress",
          tabBarLabel: "Progress",
          tabBarIcon: ({ focused }) => <View style={[styles.tabMarker, { backgroundColor: focused ? theme.accent : theme.muted }]} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: "#010807", alignItems: "center", justifyContent: "center" },
  tabMarker: { width: 18, height: 3, borderRadius: 2 },
});
