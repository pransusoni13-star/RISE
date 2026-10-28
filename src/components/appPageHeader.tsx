import { router, usePathname } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRiseAppearance } from "../services/appearance";
import { APP_HEADER_ACTIONS } from "../services/appNavigation";

export function AppPageHeader() {
  const { theme } = useRiseAppearance();
  const pathname = usePathname();
  return (
    <SafeAreaView edges={["top"]} style={[styles.safeArea, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Go to today's RISE mission" hitSlop={8} onPress={() => router.replace("/(tabs)/today" as never)} style={({ pressed }) => pressed && styles.pressed}>
          <Text style={[styles.logo, { color: theme.accent }]}>RISE</Text>
        </Pressable>
        <View style={styles.actions} accessibilityLabel="RISE shortcuts">
          {APP_HEADER_ACTIONS.map((action) => <HeaderButton key={action.route} {...action} active={pathname === action.route} />)}
        </View>
      </View>
    </SafeAreaView>
  );
}

function HeaderButton({ label, route, accessibilityLabel, active }: { label: string; route: string; accessibilityLabel: string; active: boolean }) {
  const { theme } = useRiseAppearance();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: active }}
      hitSlop={6}
      onPress={() => { if (!active) router.push(route as never); }}
      style={({ pressed }) => [styles.button, active && { backgroundColor: theme.surfaceStrong, borderColor: theme.border }, pressed && styles.pressed]}
    >
      <Text style={[styles.buttonText, { color: active ? theme.text : theme.muted }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { borderBottomWidth: StyleSheet.hairlineWidth },
  header: { width: "100%", maxWidth: 760, minHeight: 52, alignSelf: "center", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, paddingHorizontal: 18 },
  logo: { fontSize: 16, fontWeight: "900", letterSpacing: 3.5 },
  actions: { flex: 1, flexDirection: "row", justifyContent: "flex-end", gap: 4 },
  button: { minHeight: 38, borderRadius: 12, borderWidth: 1, borderColor: "transparent", paddingHorizontal: 10, alignItems: "center", justifyContent: "center" },
  buttonText: { fontSize: 10, fontWeight: "900", letterSpacing: 0.2 },
  pressed: { opacity: 0.72 },
});
