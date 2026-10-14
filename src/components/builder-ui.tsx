import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRiseAppearance } from "../services/appearance";

export function BuilderHeader({ step, onBack }: { step: 1 | 2 | 3; onBack: () => void }) {
  const { theme } = useRiseAppearance();

  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={onBack}
          style={[styles.back, { borderColor: theme.border, backgroundColor: theme.surface }]}
        >
          <Text style={[styles.backText, { color: theme.text }]}>Back</Text>
        </Pressable>
        <Text style={[styles.brand, { color: theme.accent }]}>RISE</Text>
        <Text style={[styles.step, { color: theme.muted }]}>{step} OF 3</Text>
      </View>
      <View style={styles.rail}>
        {[1, 2, 3].map((item) => (
          <View
            key={item}
            style={[
              styles.segment,
              { backgroundColor: item <= step ? theme.accent : theme.border },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 30 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  back: { minWidth: 58, height: 36, borderRadius: 18, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  backText: { fontSize: 12, fontWeight: "800" },
  brand: { fontSize: 18, fontWeight: "900", letterSpacing: 4 },
  step: { minWidth: 58, textAlign: "right", fontSize: 10, fontWeight: "900", letterSpacing: 1.1 },
  rail: { flexDirection: "row", gap: 6, marginTop: 16 },
  segment: { flex: 1, height: 3, borderRadius: 2 },
});
