import React, { useEffect, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { consentRepository } from "../services/consentRepository";
import { hasSavedProfile } from "../services/personalization";
import { useRiseAppearance } from "../services/appearance";
import { LoadFailure, LoadPending } from "./load-failure";

export default function EntryScreen() {
  const { theme } = useRiseAppearance();
  const [checking, setChecking] = useState(Platform.OS !== "web");
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    void Promise.all([hasSavedProfile(), consentRepository.hasCurrentConsent()])
      .then(([saved, consent]) => {
        if (!active) return;
        if (saved)
          router.replace(
            consent
              ? ("/(tabs)/today" as never)
              : ({
                  pathname: "/onboarding",
                  params: { next: "today", reacknowledge: "1" },
                } as never),
          );
        else setChecking(false);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [attempt]);
  if (error)
    return (
      <LoadFailure
        onRetry={() => {
          setError(false);
          setChecking(true);
          setAttempt((value) => value + 1);
        }}
      />
    );
  if (checking) return <LoadPending />;
  return (
    <SafeAreaView style={[styles.page, { backgroundColor: theme.background }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.brand, { color: theme.text }]}>RISE</Text>
          <View style={[styles.pill, { backgroundColor: theme.surfaceStrong }]}>
            <View style={[styles.dot, { backgroundColor: theme.accent }]} />
            <Text style={[styles.pillText, { color: theme.text }]}>
              A little, every day
            </Text>
          </View>
        </View>
        <View style={styles.hero}>
          <Text style={[styles.eyebrow, { color: theme.muted }]}>
            SMALL TASK. FRESH START.
          </Text>
          <Text
            accessibilityRole="header"
            style={[styles.title, { color: theme.text }]}
          >
            Less thinking.{"\n"}
            <Text style={{ color: theme.accent }}>More doing.</Text>
          </Text>
          <Text style={[styles.subtitle, { color: theme.muted }]}>
            Choose something you care about. Get one small task you can start
            today.
          </Text>
        </View>
        <View
          style={[
            styles.preview,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.previewTop}>
            <Text style={[styles.previewLabel, { color: theme.muted }]}>
              YOUR DAILY MOMENT
            </Text>
            <View
              style={[
                styles.duration,
                { backgroundColor: theme.surfaceStrong },
              ]}
            >
              <Text style={[styles.durationText, { color: theme.accent }]}>
                5 min to start
              </Text>
            </View>
          </View>
          <View
            style={[styles.art, { backgroundColor: theme.surfaceStrong }]}
            accessible
            accessibilityLabel="One small step, then another"
          >
            <View
              style={[
                styles.artStep,
                styles.stepOne,
                { backgroundColor: theme.accent, opacity: 0.18 },
              ]}
            />
            <View
              style={[
                styles.artStep,
                styles.stepTwo,
                { backgroundColor: theme.accent, opacity: 0.4 },
              ]}
            />
            <View
              style={[
                styles.artStep,
                styles.stepThree,
                { backgroundColor: theme.accent },
              ]}
            >
              <Text style={[styles.artCheck, { color: theme.accentInk }]}>
                ✓
              </Text>
            </View>
          </View>
          <Text style={[styles.previewTitle, { color: theme.text }]}>
            Something small.{"\n"}Something done.
          </Text>
          <Text style={[styles.previewBody, { color: theme.muted }]}>
            One task at a time. Your own pace.
          </Text>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            router.push({
              pathname: "/onboarding",
              params: { next: "quick-start" },
            } as never)
          }
          style={({ pressed }) => [
            styles.primary,
            { backgroundColor: theme.accent },
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.primaryText, { color: theme.accentInk }]}>
            Find my first task
          </Text>
          <Text style={[styles.arrow, { color: theme.accentInk }]}>↗</Text>
        </Pressable>
        <Text style={[styles.reassurance, { color: theme.muted }]}>
          Free · No account needed · For ages 13+
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/account" as never)}
          style={styles.signIn}
        >
          <Text style={[styles.signInText, { color: theme.muted }]}>
            Already here?{" "}
            <Text style={{ color: theme.text, fontWeight: "700" }}>
              Sign in
            </Text>
          </Text>
        </Pressable>
        <View style={styles.links}>
          {(
            [
              ["/support", "Help"],
              ["/privacy", "Privacy"],
              ["/terms", "Terms"],
            ] as const
          ).map(([route, label]) => (
            <Pressable
              accessibilityRole="link"
              key={route}
              onPress={() => router.push(route as never)}
              style={styles.link}
            >
              <Text style={[styles.linkText, { color: theme.muted }]}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  brand: { fontSize: 22, fontWeight: "900", letterSpacing: 5 },
  pill: {
    flexDirection: "row",
    gap: 7,
    alignItems: "center",
    borderRadius: 30,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pillText: { fontSize: 11, fontWeight: "600" },
  dot: { width: 6, height: 6, borderRadius: 3 },
  hero: { marginTop: 44, marginBottom: 28 },
  eyebrow: { fontSize: 10, fontWeight: "700", letterSpacing: 1.8 },
  title: {
    fontSize: 46,
    lineHeight: 51,
    fontWeight: "800",
    letterSpacing: -1.8,
    marginTop: 14,
  },
  subtitle: { fontSize: 17, lineHeight: 25, marginTop: 18, maxWidth: 410 },
  preview: {
    borderWidth: 1,
    borderRadius: 26,
    padding: 20,
    overflow: "hidden",
    marginBottom: 24,
  },
  previewTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  previewLabel: { fontSize: 9, fontWeight: "800", letterSpacing: 1.2 },
  duration: { borderRadius: 18, paddingHorizontal: 10, paddingVertical: 6 },
  durationText: { fontSize: 11, fontWeight: "700" },
  art: {
    height: 108,
    borderRadius: 18,
    marginTop: 20,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 10,
    padding: 17,
  },
  artStep: { width: 64, borderRadius: 12 },
  stepOne: { height: 27 },
  stepTwo: { height: 49 },
  stepThree: { height: 73, justifyContent: "center", alignItems: "center" },
  artCheck: { fontSize: 27, fontWeight: "600" },
  previewTitle: {
    fontSize: 27,
    lineHeight: 33,
    fontWeight: "700",
    letterSpacing: -0.6,
    marginTop: 18,
  },
  previewBody: { fontSize: 14, lineHeight: 21, marginTop: 7 },
  footer: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 8,
  },
  primary: {
    minHeight: 60,
    paddingHorizontal: 22,
    paddingVertical: 16,
    borderRadius: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  primaryText: { fontSize: 18, fontWeight: "800", flexShrink: 1 },
  arrow: { fontSize: 25 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.985 }] },
  reassurance: {
    fontSize: 11,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 12,
  },
  signIn: {
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  signInText: { fontSize: 14 },
  links: { flexDirection: "row", justifyContent: "center", gap: 18 },
  link: { minHeight: 44, justifyContent: "center" },
  linkText: { fontSize: 12 },
});
