import React from "react";
import { Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import { useRiseAppearance } from "../services/appearance";

export function RiseCard({ children, style }: { children: React.ReactNode; style?: ViewStyle | ViewStyle[] }) {
  const { theme } = useRiseAppearance();
  return <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }, style]}>{children}</View>;
}

export function RiseEyebrow({ children }: { children: React.ReactNode }) {
  const { theme } = useRiseAppearance();
  return <Text style={[styles.eyebrow, { color: theme.accent }]}>{children}</Text>;
}

export function RiseButton({
  label,
  onPress,
  disabled = false,
  variant = "primary",
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary";
}) {
  const { theme } = useRiseAppearance();
  const primary = variant === "primary";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: primary ? theme.accent : "transparent",
          borderColor: primary ? theme.accent : theme.border,
        },
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.buttonText, { color: primary ? theme.accentInk : theme.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, borderWidth: 1, padding: 20 },
  eyebrow: { fontSize: 10, fontWeight: "900", letterSpacing: 1.4 },
  button: { minHeight: 54, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
  buttonText: { fontSize: 14, fontWeight: "900", textAlign: "center" },
  disabled: { opacity: 0.52 },
  pressed: { opacity: 0.72 },
});
