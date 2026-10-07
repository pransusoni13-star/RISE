import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export function AppPageHeader({ showTour = false }: { showTour?: boolean }) {
  return (
    <View style={styles.header}>
      <Text style={styles.logo}>RISE</Text>
      <View style={styles.actions}>
        {showTour ? <HeaderButton label="Guide" symbol="?" route="/tour" /> : null}
        <HeaderButton label="Plan" symbol="↻" route="/goals" />
        <HeaderButton label="Settings" symbol="⚙" route="/settings" compact />
      </View>
    </View>
  );
}

function HeaderButton({ label, route, symbol, compact = false }: { label: string; route: string; symbol: string; compact?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      onPress={() => router.push(route as never)}
      style={({ pressed }) => [styles.button, compact && styles.compactButton, pressed && styles.pressed]}
    >
      <Text style={styles.buttonText}>{compact ? symbol : `${symbol} ${label}`}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 24 },
  logo: { color: "#7AF5B8", fontSize: 18, fontWeight: "900", letterSpacing: 5 },
  actions: { flex: 1, flexDirection: "row", justifyContent: "flex-end", gap: 7 },
  button: { minHeight: 40, borderRadius: 20, borderWidth: 1, borderColor: "#315544", paddingHorizontal: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#071B16" },
  compactButton: { width: 40, paddingHorizontal: 0 },
  buttonText: { color: "#DFFDEE", fontSize: 11, fontWeight: "900" },
  pressed: { opacity: 0.72 },
});
