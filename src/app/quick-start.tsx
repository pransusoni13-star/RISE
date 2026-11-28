import React, { useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRiseAppearance } from "../services/appearance";
import { QUICK_START_GOALS, quickStartProfile } from "../services/quickStart";
import { createSevenDayPlan, updateProfile } from "../services/personalization";
import { consentRepository } from "../services/consentRepository";

export default function QuickStartScreen() {
  const { theme } = useRiseAppearance();
  const insets = useSafeAreaInsets();
  const [goal, setGoal] = useState("");
  const [custom, setCustom] = useState("");
  const [minutes, setMinutes] = useState(5);
  const [saving, setSaving] = useState(false);
  const lock = useRef(false);
  const valid =
    Boolean(goal) && (goal !== "custom" || custom.trim().length >= 3);
  const start = async () => {
    if (!valid || lock.current) return;
    lock.current = true;
    setSaving(true);
    try {
      if (!(await consentRepository.hasCurrentConsent())) {
        router.replace({
          pathname: "/onboarding",
          params: { next: "quick-start" },
        } as never);
        return;
      }
      const profile = await updateProfile(
        quickStartProfile(goal, minutes, custom),
      );
      const mission = createSevenDayPlan(profile)[0];
      router.replace({
        pathname: "/action",
        params: { mission: JSON.stringify(mission) },
      } as never);
    } catch (error) {
      Alert.alert(
        "Couldn’t open your task",
        error instanceof Error
          ? error.message
          : "Your choices are still here. Try again.",
      );
    } finally {
      lock.current = false;
      setSaving(false);
    }
  };
  return (
    <KeyboardAvoidingView
      style={[styles.page, { backgroundColor: theme.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          style={styles.back}
        >
          <Text style={{ color: theme.muted, fontSize: 15 }}>← Back</Text>
        </Pressable>
        <Text style={[styles.eyebrow, { color: theme.accent }]}>
          LET’S KEEP IT SIMPLE
        </Text>
        <Text
          accessibilityRole="header"
          style={[styles.title, { color: theme.text }]}
        >
          What’s your{"\n"}next small win?
        </Text>
        <Text style={[styles.subtitle, { color: theme.muted }]}>
          Pick one to try. You can change it later.
        </Text>
        <View style={styles.grid}>
          {QUICK_START_GOALS.map((option) => {
            const selected = goal === option.id;
            return (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ selected, disabled: saving }}
                disabled={saving}
                key={option.id}
                onPress={() => setGoal(option.id)}
                style={({ pressed }) => [
                  styles.choice,
                  {
                    backgroundColor: selected
                      ? theme.surfaceStrong
                      : theme.surface,
                    borderColor: selected ? theme.accent : theme.border,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.choiceTop}>
                  <Text style={[styles.mark, { color: theme.accent }]}>
                    {option.mark}
                  </Text>
                  <Text style={{ color: theme.accent, fontSize: 17 }}>
                    {selected ? "✓" : ""}
                  </Text>
                </View>
                <Text style={[styles.choiceTitle, { color: theme.text }]}>
                  {option.label}
                </Text>
                <Text style={[styles.choiceDetail, { color: theme.muted }]}>
                  {option.detail}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {goal === "custom" ? (
          <TextInput
            autoFocus
            accessibilityLabel="My goal"
            value={custom}
            onChangeText={setCustom}
            editable={!saving}
            maxLength={200}
            placeholder="For example: get better at Beyblade"
            placeholderTextColor={theme.muted}
            multiline
            style={[
              styles.input,
              {
                backgroundColor: theme.surface,
                borderColor: theme.accent,
                color: theme.text,
              },
            ]}
          />
        ) : null}
        <Text style={[styles.timeTitle, { color: theme.text }]}>
          How much room do you have today?
        </Text>
        <View style={styles.times}>
          {[5, 10, 20].map((value) => (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{
                selected: minutes === value,
                disabled: saving,
              }}
              disabled={saving}
              key={value}
              onPress={() => setMinutes(value)}
              style={[
                styles.time,
                {
                  backgroundColor:
                    minutes === value ? theme.accent : theme.surface,
                  borderColor: minutes === value ? theme.accent : theme.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.timeText,
                  { color: minutes === value ? theme.accentInk : theme.text },
                ]}
              >
                {value} min
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={[styles.note, { color: theme.muted }]}>
          No skill survey. No account needed. Just a first attempt.
        </Text>
        <Pressable
          accessibilityRole="button"
          disabled={saving}
          onPress={() => router.push("/goals" as never)}
          style={styles.advanced}
        >
          <Text style={{ color: theme.muted, fontSize: 13 }}>
            Want more control? Full planning options →
          </Text>
        </Pressable>
      </ScrollView>
      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + 12,
            backgroundColor: theme.background,
            borderColor: theme.border,
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !valid || saving, busy: saving }}
          disabled={!valid || saving}
          onPress={() => void start()}
          style={[
            styles.primary,
            {
              backgroundColor: theme.accent,
              opacity: !valid || saving ? 0.45 : 1,
            },
          ]}
        >
          <Text style={[styles.primaryText, { color: theme.accentInk }]}>
            {saving
              ? "Finding your first task…"
              : valid
                ? `Show my ${minutes}-minute task  ↗`
                : "Choose a direction to start"}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: {
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
    padding: 24,
    paddingBottom: 24,
  },
  back: {
    minHeight: 44,
    justifyContent: "center",
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  eyebrow: { fontSize: 10, fontWeight: "800", letterSpacing: 1.5 },
  title: {
    fontSize: 37,
    lineHeight: 43,
    fontWeight: "800",
    letterSpacing: -1,
    marginTop: 12,
  },
  subtitle: { fontSize: 15, lineHeight: 23, marginTop: 12, marginBottom: 24 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  choice: {
    width: "48%",
    flexGrow: 1,
    minHeight: 130,
    borderRadius: 19,
    borderWidth: 1,
    padding: 15,
  },
  choiceTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 13,
  },
  mark: { fontSize: 23, fontWeight: "600" },
  choiceTitle: { fontSize: 17, fontWeight: "700" },
  choiceDetail: { fontSize: 12, lineHeight: 18, marginTop: 5 },
  input: {
    minHeight: 72,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    marginTop: 14,
    textAlignVertical: "top",
  },
  timeTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 26,
    marginBottom: 12,
  },
  times: { flexDirection: "row", gap: 10 },
  time: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    minHeight: 52,
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  timeText: { fontSize: 16, fontWeight: "700" },
  note: { fontSize: 12, lineHeight: 19, marginTop: 14 },
  advanced: { minHeight: 48, justifyContent: "center", marginTop: 8 },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  primary: {
    minHeight: 58,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  primaryText: { fontSize: 17, fontWeight: "800", textAlign: "center" },
  pressed: { opacity: 0.8 },
});
