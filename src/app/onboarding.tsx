import React, { useRef, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { consentRepository } from "../services/consentRepository";
import { useRiseAppearance } from "../services/appearance";

export default function OnboardingScreen() {
  const params = useLocalSearchParams<{
    next?: string;
    reacknowledge?: string;
  }>();
  const { theme } = useRiseAppearance();
  const [age, setAge] = useState(false),
    [terms, setTerms] = useState(false),
    [saving, setSaving] = useState(false);
  const lock = useRef(false);
  const next = async () => {
    if (!age || !terms || lock.current) return;
    lock.current = true;
    setSaving(true);
    try {
      await consentRepository.save();
      const route =
        params.next === "today"
          ? "/(tabs)/today"
          : params.next === "plan"
            ? "/plan"
            : params.next === "popular-skills"
              ? "/popular-skills"
              : "/quick-start";
      router.replace(route as never);
    } catch {
      Alert.alert(
        "That didn’t save",
        "Your choices are still here. Try again.",
      );
    } finally {
      lock.current = false;
      setSaving(false);
    }
  };
  return (
    <SafeAreaView style={[styles.page, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.brand, { color: theme.accent }]}>RISE</Text>
        <Text style={[styles.eyebrow, { color: theme.muted }]}>
          {params.reacknowledge === "1"
            ? "A QUICK PRIVACY CHECK"
            : "BEFORE YOUR FIRST SMALL WIN"}
        </Text>
        <Text
          accessibilityRole="header"
          style={[styles.title, { color: theme.text }]}
        >
          {params.reacknowledge === "1"
            ? "A quick check, then back to you."
            : "Your pace. Your progress."}
        </Text>
        <Text style={[styles.body, { color: theme.muted }]}>
          Your written notes and proof stay on this device. An account is
          optional. Signed-in members can sync their task and quiz activity.
        </Text>
        <Check
          checked={age}
          disabled={saving}
          onPress={() => setAge((value) => !value)}
          title="I’m 13 or older"
          detail="RISE is intended for ages 13 and up."
        />
        <Check
          checked={terms}
          disabled={saving}
          onPress={() => setTerms((value) => !value)}
          title="I agree to the Terms and understand the limits"
          detail="Tasks are educational suggestions, not professional advice."
        />
        <View style={styles.links}>
          {(
            [
              ["/privacy", "Privacy Policy"],
              ["/terms", "Terms of Use"],
              ["/legal", "Safety"],
            ] as const
          ).map(([route, label]) => (
            <Pressable
              accessibilityRole="link"
              key={route}
              onPress={() => router.push(route as never)}
              style={styles.link}
            >
              <Text
                style={{ color: theme.accent, fontSize: 14, fontWeight: "600" }}
              >
                {label} ↗
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{
            disabled: !age || !terms || saving,
            busy: saving,
          }}
          disabled={!age || !terms || saving}
          onPress={() => void next()}
          style={[
            styles.primary,
            {
              backgroundColor: theme.accent,
              opacity: !age || !terms || saving ? 0.45 : 1,
            },
          ]}
        >
          <Text style={[styles.primaryText, { color: theme.accentInk }]}>
            {saving
              ? "Saving…"
              : params.reacknowledge === "1"
                ? "Agree and continue"
                : "Agree & find my task  →"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
function Check({
  checked,
  disabled,
  onPress,
  title,
  detail,
}: {
  checked: boolean;
  disabled: boolean;
  onPress: () => void;
  title: string;
  detail: string;
}) {
  const { theme } = useRiseAppearance();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.check,
        {
          borderColor: checked ? theme.accent : theme.border,
          backgroundColor: checked ? theme.surfaceStrong : theme.surface,
        },
      ]}
    >
      <View
        style={[
          styles.box,
          {
            borderColor: checked ? theme.accent : theme.border,
            backgroundColor: checked ? theme.accent : "transparent",
          },
        ]}
      >
        <Text style={{ color: theme.accentInk, fontWeight: "800" }}>
          {checked ? "✓" : ""}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.checkTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.detail, { color: theme.muted }]}>{detail}</Text>
      </View>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  page: { flex: 1 },
  content: {
    width: "100%",
    maxWidth: 580,
    alignSelf: "center",
    padding: 26,
    paddingBottom: 20,
  },
  brand: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 5,
    marginTop: 16,
    marginBottom: 48,
  },
  eyebrow: { fontSize: 10, fontWeight: "800", letterSpacing: 1.6 },
  title: {
    fontSize: 39,
    lineHeight: 46,
    fontWeight: "800",
    letterSpacing: -1,
    marginTop: 14,
  },
  body: { fontSize: 16, lineHeight: 25, marginTop: 18, marginBottom: 30 },
  check: {
    borderWidth: 1,
    borderRadius: 19,
    padding: 18,
    flexDirection: "row",
    gap: 14,
    marginBottom: 12,
    minHeight: 90,
  },
  box: {
    height: 26,
    width: 26,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkTitle: { fontSize: 16, lineHeight: 23, fontWeight: "700" },
  detail: { fontSize: 13, lineHeight: 20, marginTop: 5 },
  links: { marginTop: 10, flexDirection: "row", flexWrap: "wrap", gap: 18 },
  link: { minHeight: 44, justifyContent: "center" },
  footer: { paddingHorizontal: 26, paddingBottom: 12, paddingTop: 10 },
  primary: {
    minHeight: 58,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  primaryText: { fontSize: 17, fontWeight: "800", textAlign: "center" },
});
