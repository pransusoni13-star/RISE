import React, { useEffect, useState } from "react";
import { Tabs, router } from "expo-router";
import { StyleSheet, Text, View, type ColorValue } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRiseAppearance } from "../../services/appearance";
import { consentRepository } from "../../services/consentRepository";
import { LoadFailure, LoadPending } from "../../components/load-failure";

export default function TabsLayout() {
  const { theme } = useRiseAppearance();
  const insets = useSafeAreaInsets();
  const [ready, setReady] = useState(false),
    [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    void consentRepository
      .hasCurrentConsent()
      .then((current) => {
        if (!active) return;
        if (!current) {
          router.replace({
            pathname: "/onboarding",
            params: { next: "today", reacknowledge: "1" },
          } as never);
          return;
        }
        setReady(true);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, []);
  if (error) return <LoadFailure />;
  if (!ready) return <LoadPending />;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.muted,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: theme.border,
          height: 64 + insets.bottom,
          paddingTop: 8,
          paddingBottom: Math.max(8, insets.bottom),
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "700", marginTop: 4 },
      }}
    >
      <Tabs.Screen
        name="today"
        options={{
          title: "Today",
          tabBarIcon: ({ color }) => <TabGlyph kind="today" color={color} />,
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: "Learn",
          tabBarIcon: ({ color }) => <TabGlyph kind="learn" color={color} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: "Progress",
          tabBarIcon: ({ color }) => <TabGlyph kind="progress" color={color} />,
        }}
      />
      <Tabs.Screen name="missions" options={{ href: null }} />
      <Tabs.Screen name="projects" options={{ href: null }} />
    </Tabs>
  );
}
function TabGlyph({
  kind,
  color,
}: {
  kind: "today" | "learn" | "progress";
  color: ColorValue;
}) {
  if (kind === "today")
    return (
      <View accessible={false} style={[styles.today, { borderColor: color }]}>
        <Text style={{ color, fontSize: 13, fontWeight: "700" }}>✓</Text>
      </View>
    );
  if (kind === "learn")
    return (
      <View accessible={false} style={styles.lines}>
        {[19, 14, 19].map((width, index) => (
          <View
            key={index}
            style={{
              width,
              height: 3,
              borderRadius: 2,
              backgroundColor: color,
            }}
          />
        ))}
      </View>
    );
  return (
    <View accessible={false} style={styles.bars}>
      {[8, 13, 20].map((height, index) => (
        <View
          key={index}
          style={{ width: 4, height, borderRadius: 2, backgroundColor: color }}
        />
      ))}
    </View>
  );
}
const styles = StyleSheet.create({
  today: {
    height: 22,
    width: 22,
    borderWidth: 2,
    borderRadius: 7,
    justifyContent: "center",
    alignItems: "center",
  },
  lines: { height: 22, width: 22, justifyContent: "center", gap: 4 },
  bars: {
    height: 22,
    width: 22,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 3,
  },
});
