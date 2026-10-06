import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export function AppPageHeader({ showTour = false }: { showTour?: boolean }) {
  return (
    <View style={styles.header}>
      <Text style={styles.logo}>RISE</Text>
      <View style={styles.actions}>
        {showTour ? <HeaderButton label="Tour" route="/tour" /> : null}
        <HeaderButton label="Change plan" route="/goals" />
        <HeaderButton label="Settings" route="/settings" />
      </View>
    </View>
  );
}

function HeaderButton({ label, route }: { label: string; route: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      onPress={() => router.push(route as never)}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 20 },
  logo: { color: "#7AF5B8", fontSize: 18, fontWeight: "900", letterSpacing: 5 },
  actions: { flex: 1, flexDirection: "row", justifyContent: "flex-end", flexWrap: "wrap", gap: 7 },
  button: { minHeight: 38, borderRadius: 19, borderWidth: 1, borderColor: "#315544", paddingHorizontal: 11, alignItems: "center", justifyContent: "center", backgroundColor: "#071B16" },
  buttonText: { color: "#DFFDEE", fontSize: 10, fontWeight: "900" },
  pressed: { opacity: 0.72 },
});
