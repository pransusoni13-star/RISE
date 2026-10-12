import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRiseAppearance } from "../services/appearance";

export function AppPageHeader({ showTour = false }: { showTour?: boolean }) {
  const { theme } = useRiseAppearance();
  return (
    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Go to RISE home" hitSlop={8} onPress={() => router.replace("/(tabs)/today" as never)} style={({ pressed }) => pressed && styles.pressed}>
        <Text style={[styles.logo, { color: theme.accent }]}>RISE</Text>
      </Pressable>
      <View style={styles.actions}>
        {showTour ? <HeaderButton label="Guide" route="/tour" /> : null}
        <HeaderButton label="Plan" route="/goals" />
        <HeaderButton label="Settings" route="/settings" />
      </View>
    </View>
  );
}

function HeaderButton({ label, route }: { label: string; route: string }) {
  const { theme } = useRiseAppearance();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      onPress={() => router.push(route as never)}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Text style={[styles.buttonText, { color: theme.muted }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 30 },
  logo: { color: "#7AF5B8", fontSize: 17, fontWeight: "900", letterSpacing: 4 },
  actions: { flex: 1, flexDirection: "row", justifyContent: "flex-end", gap: 7 },
  button: { minHeight: 40, paddingHorizontal: 7, alignItems: "center", justifyContent: "center" },
  buttonText: { color: "#DFFDEE", fontSize: 11, fontWeight: "800" },
  pressed: { opacity: 0.72 },
});
