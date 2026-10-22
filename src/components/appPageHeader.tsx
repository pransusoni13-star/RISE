import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRiseAppearance } from "../services/appearance";
import { APP_HEADER_ACTIONS } from "../services/appNavigation";

export function AppPageHeader() {
  const { theme } = useRiseAppearance();
  return (
    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Go to RISE home" hitSlop={8} onPress={() => router.replace("/(tabs)/today" as never)} style={({ pressed }) => pressed && styles.pressed}>
        <Text style={[styles.logo, { color: theme.accent }]}>RISE</Text>
      </Pressable>
      <View style={styles.actions} accessibilityLabel="RISE menu">
        {APP_HEADER_ACTIONS.map((action) => <HeaderButton key={action.route} {...action} />)}
      </View>
    </View>
  );
}

function HeaderButton({ label, route, accessibilityLabel }: { label: string; route: string; accessibilityLabel: string }) {
  const { theme } = useRiseAppearance();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={6}
      onPress={() => router.push(route as never)}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Text style={[styles.buttonText, { color: theme.muted }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 5, marginBottom: 24 },
  logo: { fontSize: 16, fontWeight: "900", letterSpacing: 3.5 },
  actions: { flex: 1, flexDirection: "row", justifyContent: "flex-end", gap: 0 },
  button: { minHeight: 44, borderRadius: 12, paddingHorizontal: 8, alignItems: "center", justifyContent: "center" },
  buttonText: { fontSize: 10, fontWeight: "900" },
  pressed: { opacity: 0.72 },
});
