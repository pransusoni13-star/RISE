import Head from "expo-router/head";
import { router } from "expo-router";
import { useSyncExternalStore } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const COLORS = {
  background: "#020806",
  surface: "#071B16",
  surfaceRaised: "#0B281D",
  border: "#24483A",
  green: "#7AF5B8",
  greenStrong: "#45E697",
  text: "#F5FFF9",
  muted: "#A9C9B8",
  quiet: "#789B89",
  gold: "#FFD37D",
};

const capabilities = [
  {
    number: "01",
    title: "Two sides of your life",
    body: "Choose one career or learning direction and one health, athletic, spiritual, or personal direction.",
  },
  {
    number: "02",
    title: "A plan that fits your day",
    body: "RISE adapts missions to your experience, available time, equipment, and preferred 7, 10, 30-day, or monthly cycle.",
  },
  {
    number: "03",
    title: "Proof with reflection",
    body: "Attach relevant proof and explain what you learned. Clear checks help you build honest momentum instead of tapping a checkbox.",
  },
  {
    number: "04",
    title: "Earn the next level",
    body: "Finish your cycle, pass a short review, earn a badge and coins, then choose the next skill with evidence behind you.",
  },
];

const examples = [
  ["Software engineering", "Mobility"],
  ["Barbering", "Strength"],
  ["YouTube", "Nutrition"],
  ["Graphic design", "Mindfulness"],
];

const faqs = [
  {
    question: "Does RISE require payment or an account?",
    answer: "No. The beta is free and collects no payment. You can start a guest plan on this device; an optional account syncs goals and progress. Proof photos and videos remain on your device.",
  },
  {
    question: "Does RISE guarantee that submitted proof is authentic?",
    answer: "No. RISE performs transparent consistency checks on the attachment and reflection. It does not claim to authenticate real-world activity with certainty.",
  },
  {
    question: "Will every person receive the same missions?",
    answer: "No. Missions use the person's selected directions, skills, cycle length, time commitment, experience, and prior progress.",
  },
  {
    question: "Is RISE medical, legal, financial, or religious advice?",
    answer: "No. It is an educational planning tool. High-stakes topics should use qualified professionals and trusted primary sources.",
  },
];

function subscribeToViewport(onChange: () => void) {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
}

function getViewportWidth() {
  return window.innerWidth;
}

function getServerViewportWidth() {
  return 1280;
}

function ActionButton({ label, secondary = false, onPress }: { label: string; secondary?: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ hovered, pressed }) => [
        styles.action,
        secondary && styles.actionSecondary,
        hovered && styles.actionHovered,
        pressed && styles.actionPressed,
      ]}>
      <Text style={[styles.actionText, secondary && styles.actionTextSecondary]}>{label}</Text>
    </Pressable>
  );
}

export default function WebHomeScreen() {
  const viewportWidth = useSyncExternalStore(
    subscribeToViewport,
    getViewportWidth,
    getServerViewportWidth,
  );

  // Direct browser width avoids desktop scaling differences in React Native's
  // device dimensions while preserving the same native application routes.
  const compact = viewportWidth < 820;

  return (
    <>
      <Head>
        <title>RISE — Personalized missions for real progress</title>
        <meta
          name="description"
          content="Build career and personal skills through personalized missions, useful resources, proof, reflection, quizzes, badges, and visible progress."
        />
        <meta name="theme-color" content="#020806" />
        <meta name="robots" content="index,follow" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="RISE — Become 1% better through action" />
        <meta
          property="og:description"
          content="A personalized mission system for building one career skill and one life skill at a sustainable pace."
        />
        <meta name="twitter:card" content="summary" />
      </Head>

      <ScrollView style={styles.page} contentContainerStyle={styles.pageContent}>
        <View style={styles.glowTop} />
        <View style={styles.glowMiddle} />

        <View accessibilityRole="header" style={[styles.nav, compact && styles.navCompact]}>
          <Pressable accessibilityRole="link" accessibilityLabel="RISE home" onPress={() => router.replace("/")}>
            <Text style={styles.wordmark}>RISE</Text>
          </Pressable>
          {!compact && (
            <View style={styles.navLinks}>
              <Pressable accessibilityRole="link" onPress={() => router.push("/help" as never)}><Text style={styles.navLink}>How it works</Text></Pressable>
              <Pressable accessibilityRole="link" onPress={() => router.push("/rewards" as never)}><Text style={styles.navLink}>Rewards</Text></Pressable>
              <Pressable accessibilityRole="link" onPress={() => router.push("/legal" as never)}><Text style={styles.navLink}>Privacy & safety</Text></Pressable>
            </View>
          )}
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/account" as never)}
            style={({ hovered, pressed }) => [styles.navCta, hovered && styles.navCtaHovered, pressed && styles.actionPressed]}>
            <Text style={styles.navCtaText}>Start RISE</Text>
          </Pressable>
        </View>

        <View style={[styles.hero, compact && styles.heroCompact]}>
          <View style={[styles.heroCopy, compact && styles.heroCopyCompact]}>
            <View style={styles.betaPill}><View style={styles.betaDot} /><Text style={styles.betaText}>FREE BETA · PRIVATE PROOF · NO CREDIT CARD</Text></View>
            <Text accessibilityRole="header" style={[styles.heroTitle, compact && styles.heroTitleCompact]}>
              Become who you said you would be.
            </Text>
            <Text style={styles.heroSubtitle}>
              RISE turns two meaningful goals into focused daily missions—with reliable resources, honest proof, reflection, and progress you can see.
            </Text>
            <View style={[styles.heroActions, compact && styles.stackActions]}>
              <ActionButton label="Build my free plan →" onPress={() => router.push("/account" as never)} />
              <ActionButton label="Explore the experience" secondary onPress={() => router.push("/(tabs)/today" as never)} />
            </View>
            <Text style={styles.microcopy}>Start on this device. No credit card. You control your pace.</Text>
          </View>

          <View style={[styles.productFrame, compact && styles.productFrameCompact]} accessibilityLabel="Example personalized RISE mission">
            <View style={styles.frameTop}><Text style={styles.frameBrand}>RISE</Text><Text style={styles.frameDay}>DAY 04 / 10</Text></View>
            <View style={styles.progressTrack}><View style={styles.progressFill} /></View>
            <Text style={styles.trackLabel}>CAREER · SOFTWARE ENGINEERING</Text>
            <Text style={styles.missionTitle}>Build one reusable interface component</Text>
            <Text style={styles.missionBody}>Create a button with clear default, pressed, disabled, and keyboard-focus states.</Text>
            <View style={styles.missionMeta}>
              <View style={styles.metaChip}><Text style={styles.metaText}>20 min</Text></View>
              <View style={styles.metaChip}><Text style={styles.metaText}>Beginner</Text></View>
              <View style={styles.metaChip}><Text style={styles.metaText}>+30 XP</Text></View>
            </View>
            <View style={styles.stepCard}>
              <Text style={styles.stepNumber}>1</Text><View style={styles.stepCopy}><Text style={styles.stepTitle}>Learn the pattern</Text><Text style={styles.stepBody}>Use the official React Native Pressable guide.</Text></View><Text style={styles.stepCheck}>✓</Text>
            </View>
            <View style={styles.stepCard}>
              <Text style={styles.stepNumber}>2</Text><View style={styles.stepCopy}><Text style={styles.stepTitle}>Build and test</Text><Text style={styles.stepBody}>Check mouse, touch, and keyboard input.</Text></View><Text style={styles.stepArrow}>→</Text>
            </View>
            <View style={styles.proofButton}><Text style={styles.proofButtonText}>Continue mission</Text></View>
          </View>
        </View>

        <View style={styles.trustStrip}>
          <Text style={styles.trustLead}>ONE SYSTEM · TWO DIRECTIONS</Text>
          <View style={styles.exampleWrap}>{examples.map(([first, second]) => <View key={first} style={styles.examplePair}><Text style={styles.exampleText}>{first}</Text><Text style={styles.plus}>+</Text><Text style={styles.exampleText}>{second}</Text></View>)}</View>
        </View>

        <View style={styles.section}>
          <Text style={styles.eyebrow}>HOW RISE WORKS</Text>
          <Text accessibilityRole="header" style={[styles.sectionTitle, compact && styles.sectionTitleCompact]}>Simple enough to start. Structured enough to matter.</Text>
          <View style={[styles.capabilityGrid, compact && styles.oneColumn]}>
            {capabilities.map((item) => (
              <View key={item.number} style={styles.capabilityCard}>
                <Text style={styles.capabilityNumber}>{item.number}</Text>
                <Text style={styles.capabilityTitle}>{item.title}</Text>
                <Text style={styles.capabilityBody}>{item.body}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.splitSection, compact && styles.splitSectionCompact]}>
          <View style={styles.splitCopy}>
            <Text style={styles.eyebrow}>PERSONALIZATION WITH A PURPOSE</Text>
            <Text accessibilityRole="header" style={[styles.sectionTitle, compact && styles.sectionTitleCompact]}>The plan changes when your life changes.</Text>
            <Text style={styles.sectionBody}>Choose your pace, tell RISE what you have available, and give feedback after missions. The next task should respond to your reality—not trap you in a generic streak.</Text>
          </View>
          <View style={styles.preferencePanel}>
            <Text style={styles.panelLabel}>YOUR CYCLE</Text>
            <View style={styles.cycleRow}>{["7 days", "10 days", "30 days", "Monthly"].map((cycle, index) => <View key={cycle} style={[styles.cycleChip, index === 1 && styles.cycleChipActive]}><Text style={[styles.cycleText, index === 1 && styles.cycleTextActive]}>{cycle}</Text></View>)}</View>
            <View style={styles.divider} />
            <Text style={styles.panelLabel}>TODAY’S TIME</Text>
            <View style={styles.timeRow}><Text style={styles.timeValue}>20</Text><View><Text style={styles.timeUnit}>MINUTES</Text><Text style={styles.timeHint}>Focused, realistic, repeatable</Text></View></View>
          </View>
        </View>

        <View style={styles.safetySection}>
          <View style={styles.safetyIcon}><Text style={styles.safetyIconText}>✓</Text></View>
          <View style={styles.safetyCopy}><Text style={styles.safetyTitle}>Trust is part of the product.</Text><Text style={styles.safetyBody}>RISE explains how proof is checked, avoids guarantees it cannot support, stores current progress on-device, and gives users direct access to help, feedback, privacy, safety, and deletion controls.</Text></View>
          <Pressable accessibilityRole="link" onPress={() => router.push("/legal" as never)} style={styles.textLinkButton}><Text style={styles.textLink}>Read privacy & safety →</Text></Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.eyebrow}>CLEAR ANSWERS</Text>
          <Text accessibilityRole="header" style={[styles.sectionTitle, compact && styles.sectionTitleCompact]}>Before you begin.</Text>
          <View style={styles.faqList}>{faqs.map((faq) => <View key={faq.question} style={styles.faqItem}><Text style={styles.faqQuestion}>{faq.question}</Text><Text style={styles.faqAnswer}>{faq.answer}</Text></View>)}</View>
        </View>

        <View style={styles.finalCta}>
          <Text style={styles.finalEyebrow}>YOUR NEXT 1% STARTS HERE</Text>
          <Text accessibilityRole="header" style={[styles.finalTitle, compact && styles.sectionTitleCompact]}>One mission. Done properly.</Text>
          <Text style={styles.finalBody}>Build a balanced plan in a few minutes, then let consistent action do the rest.</Text>
          <View style={styles.finalButton}><ActionButton label="Build my RISE plan →" onPress={() => router.push("/account" as never)} /></View>
        </View>

        <View style={[styles.footer, compact && styles.footerCompact]}>
          <View><Text style={styles.wordmark}>RISE</Text><Text style={styles.footerTagline}>Personal growth through focused action.</Text></View>
          <View style={styles.footerLinks}>
            <Pressable accessibilityRole="link" onPress={() => router.push("/help" as never)}><Text style={styles.footerLink}>Help</Text></Pressable>
            <Pressable accessibilityRole="link" onPress={() => router.push("/feedback" as never)}><Text style={styles.footerLink}>Feedback</Text></Pressable>
            <Pressable accessibilityRole="link" onPress={() => router.push("/legal" as never)}><Text style={styles.footerLink}>Privacy & safety</Text></Pressable>
          </View>
          <Text style={styles.footerLegal}>Educational planning tool · Private proof files · No payment collected</Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: COLORS.background },
  pageContent: { minHeight: "100%", overflow: "hidden" },
  glowTop: { pointerEvents: "none", position: "absolute", width: 800, height: 800, borderRadius: 400, backgroundColor: COLORS.green, opacity: 0.055, top: -510, right: -200 },
  glowMiddle: { pointerEvents: "none", position: "absolute", width: 600, height: 600, borderRadius: 300, backgroundColor: "#29A6FF", opacity: 0.035, top: 820, left: -400 },
  nav: { width: "100%", maxWidth: 1240, alignSelf: "center", paddingHorizontal: 32, height: 88, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  navCompact: { height: 72, paddingHorizontal: 20 },
  wordmark: { color: COLORS.green, fontSize: 21, fontWeight: "900", letterSpacing: 6 },
  navLinks: { flexDirection: "row", alignItems: "center", gap: 30 },
  navLink: { color: COLORS.muted, fontSize: 13, fontWeight: "700", paddingVertical: 12 },
  navCta: { minHeight: 44, justifyContent: "center", paddingHorizontal: 20, borderRadius: 24, borderWidth: 1, borderColor: COLORS.border, backgroundColor: "rgba(122,245,184,0.06)" },
  navCtaHovered: { borderColor: COLORS.green },
  navCtaText: { color: COLORS.green, fontWeight: "900", fontSize: 12 },
  hero: { width: "100%", maxWidth: 1240, alignSelf: "center", paddingHorizontal: 32, paddingTop: 80, paddingBottom: 104, flexDirection: "row", alignItems: "center", gap: 80 },
  heroCompact: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 70, flexDirection: "column", gap: 52 },
  heroCopy: { flex: 1, maxWidth: 650 },
  heroCopyCompact: { width: "100%", alignItems: "center" },
  betaPill: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: COLORS.border, backgroundColor: "rgba(122,245,184,0.05)" },
  betaDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.green },
  betaText: { color: COLORS.green, fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  heroTitle: { color: COLORS.text, fontSize: 68, lineHeight: 72, letterSpacing: -2.6, fontWeight: "900", marginTop: 26, maxWidth: 650 },
  heroTitleCompact: { fontSize: 43, lineHeight: 48, letterSpacing: -1.2, textAlign: "center" },
  heroSubtitle: { color: COLORS.muted, fontSize: 19, lineHeight: 30, maxWidth: 600, marginTop: 24 },
  heroActions: { flexDirection: "row", gap: 12, marginTop: 32 },
  stackActions: { width: "100%", flexDirection: "column" },
  action: { minHeight: 54, borderRadius: 27, paddingHorizontal: 25, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.green, borderWidth: 1, borderColor: COLORS.green },
  actionSecondary: { backgroundColor: "transparent", borderColor: COLORS.border },
  actionHovered: { transform: [{ translateY: -2 }], borderColor: COLORS.greenStrong },
  actionPressed: { opacity: 0.82, transform: [{ translateY: 1 }] },
  actionText: { color: COLORS.background, fontSize: 14, fontWeight: "900" },
  actionTextSecondary: { color: COLORS.text },
  microcopy: { color: COLORS.quiet, fontSize: 11, marginTop: 14 },
  productFrame: { width: 390, borderRadius: 30, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, padding: 24, boxShadow: "0 18px 40px rgba(122,245,184,0.12)" },
  productFrameCompact: { width: "100%", maxWidth: 430 },
  frameTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  frameBrand: { color: COLORS.green, fontSize: 13, fontWeight: "900", letterSpacing: 3 },
  frameDay: { color: COLORS.quiet, fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  progressTrack: { height: 5, borderRadius: 3, backgroundColor: "#15372A", overflow: "hidden", marginTop: 16 },
  progressFill: { height: "100%", width: "40%", borderRadius: 3, backgroundColor: COLORS.green },
  trackLabel: { color: COLORS.green, fontSize: 9, fontWeight: "900", letterSpacing: 1.2, marginTop: 28 },
  missionTitle: { color: COLORS.text, fontSize: 26, lineHeight: 31, fontWeight: "900", marginTop: 9 },
  missionBody: { color: COLORS.muted, fontSize: 13, lineHeight: 20, marginTop: 10 },
  missionMeta: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 17 },
  metaChip: { borderRadius: 999, backgroundColor: "#113326", paddingHorizontal: 10, paddingVertical: 6 },
  metaText: { color: COLORS.muted, fontSize: 9, fontWeight: "800" },
  stepCard: { minHeight: 66, flexDirection: "row", alignItems: "center", borderRadius: 15, borderWidth: 1, borderColor: COLORS.border, padding: 12, marginTop: 10 },
  stepNumber: { width: 28, height: 28, borderRadius: 14, textAlign: "center", lineHeight: 28, overflow: "hidden", backgroundColor: "#123729", color: COLORS.green, fontSize: 11, fontWeight: "900" },
  stepCopy: { flex: 1, paddingHorizontal: 11 },
  stepTitle: { color: COLORS.text, fontSize: 11, fontWeight: "900" },
  stepBody: { color: COLORS.quiet, fontSize: 9, marginTop: 3 },
  stepCheck: { color: COLORS.green, fontSize: 16, fontWeight: "900" },
  stepArrow: { color: COLORS.muted, fontSize: 16, fontWeight: "900" },
  proofButton: { minHeight: 46, alignItems: "center", justifyContent: "center", borderRadius: 23, backgroundColor: COLORS.green, marginTop: 18 },
  proofButtonText: { color: COLORS.background, fontSize: 12, fontWeight: "900" },
  trustStrip: { width: "100%", borderTopWidth: 1, borderBottomWidth: 1, borderColor: "#173329", paddingVertical: 28, alignItems: "center", backgroundColor: "rgba(7,27,22,0.5)" },
  trustLead: { color: COLORS.quiet, fontSize: 9, fontWeight: "900", letterSpacing: 1.4 },
  exampleWrap: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 10, marginTop: 15, paddingHorizontal: 20 },
  examplePair: { flexDirection: "row", alignItems: "center", borderRadius: 999, backgroundColor: COLORS.surface, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: COLORS.border },
  exampleText: { color: COLORS.muted, fontSize: 10, fontWeight: "800" },
  plus: { color: COLORS.green, fontSize: 11, fontWeight: "900", paddingHorizontal: 7 },
  section: { width: "100%", maxWidth: 1180, alignSelf: "center", paddingHorizontal: 28, paddingVertical: 104 },
  eyebrow: { color: COLORS.green, fontSize: 10, fontWeight: "900", letterSpacing: 1.6 },
  sectionTitle: { color: COLORS.text, fontSize: 45, lineHeight: 51, fontWeight: "900", letterSpacing: -1.2, maxWidth: 720, marginTop: 13 },
  sectionTitleCompact: { fontSize: 34, lineHeight: 40, letterSpacing: -0.7 },
  sectionBody: { color: COLORS.muted, fontSize: 16, lineHeight: 26, marginTop: 19, maxWidth: 600 },
  capabilityGrid: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginTop: 48 },
  oneColumn: { flexDirection: "column" },
  capabilityCard: { flexGrow: 1, flexBasis: 250, minHeight: 230, borderRadius: 22, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: "#193A2E", padding: 25 },
  capabilityNumber: { color: COLORS.green, fontSize: 11, fontWeight: "900", letterSpacing: 1 },
  capabilityTitle: { color: COLORS.text, fontSize: 20, fontWeight: "900", marginTop: 30 },
  capabilityBody: { color: COLORS.muted, fontSize: 13, lineHeight: 21, marginTop: 10 },
  splitSection: { width: "100%", maxWidth: 1180, alignSelf: "center", paddingHorizontal: 28, paddingVertical: 94, flexDirection: "row", alignItems: "center", gap: 80 },
  splitSectionCompact: { flexDirection: "column", alignItems: "stretch", gap: 44 },
  splitCopy: { flex: 1 },
  preferencePanel: { flex: 1, borderRadius: 26, backgroundColor: COLORS.surfaceRaised, borderWidth: 1, borderColor: COLORS.border, padding: 26 },
  panelLabel: { color: COLORS.quiet, fontSize: 9, fontWeight: "900", letterSpacing: 1.3 },
  cycleRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
  cycleChip: { borderRadius: 999, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 12, paddingVertical: 8 },
  cycleChipActive: { backgroundColor: COLORS.green, borderColor: COLORS.green },
  cycleText: { color: COLORS.muted, fontSize: 10, fontWeight: "800" },
  cycleTextActive: { color: COLORS.background },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 25 },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 9 },
  timeValue: { color: COLORS.text, fontSize: 56, fontWeight: "900", letterSpacing: -2 },
  timeUnit: { color: COLORS.green, fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  timeHint: { color: COLORS.quiet, fontSize: 10, marginTop: 4 },
  safetySection: { width: "100%", maxWidth: 1124, alignSelf: "center", marginVertical: 32, padding: 30, borderRadius: 24, backgroundColor: "rgba(122,245,184,0.06)", borderWidth: 1, borderColor: COLORS.border, flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 20 },
  safetyIcon: { width: 45, height: 45, borderRadius: 23, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.green },
  safetyIconText: { color: COLORS.background, fontSize: 20, fontWeight: "900" },
  safetyCopy: { flex: 1, minWidth: 240 },
  safetyTitle: { color: COLORS.text, fontSize: 18, fontWeight: "900" },
  safetyBody: { color: COLORS.muted, fontSize: 12, lineHeight: 19, marginTop: 6, maxWidth: 660 },
  textLinkButton: { minHeight: 44, justifyContent: "center", paddingHorizontal: 8 },
  textLink: { color: COLORS.green, fontSize: 11, fontWeight: "900" },
  faqList: { marginTop: 42, borderTopWidth: 1, borderColor: COLORS.border },
  faqItem: { paddingVertical: 25, borderBottomWidth: 1, borderColor: COLORS.border },
  faqQuestion: { color: COLORS.text, fontSize: 16, fontWeight: "900" },
  faqAnswer: { color: COLORS.muted, fontSize: 13, lineHeight: 21, marginTop: 9, maxWidth: 820 },
  finalCta: { width: "100%", maxWidth: 1124, alignSelf: "center", alignItems: "center", paddingHorizontal: 24, paddingVertical: 72, marginVertical: 34, borderRadius: 32, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  finalEyebrow: { color: COLORS.green, fontSize: 10, fontWeight: "900", letterSpacing: 1.5, textAlign: "center" },
  finalTitle: { color: COLORS.text, fontSize: 48, fontWeight: "900", letterSpacing: -1.3, marginTop: 12, textAlign: "center" },
  finalBody: { color: COLORS.muted, fontSize: 15, lineHeight: 23, marginTop: 13, textAlign: "center" },
  finalButton: { marginTop: 26 },
  footer: { width: "100%", maxWidth: 1240, alignSelf: "center", borderTopWidth: 1, borderColor: "#173329", paddingHorizontal: 32, paddingVertical: 42, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 30 },
  footerCompact: { alignItems: "flex-start", flexDirection: "column", paddingHorizontal: 20 },
  footerTagline: { color: COLORS.quiet, fontSize: 10, marginTop: 7 },
  footerLinks: { flexDirection: "row", flexWrap: "wrap", gap: 22 },
  footerLink: { color: COLORS.muted, fontSize: 11, fontWeight: "800", paddingVertical: 10 },
  footerLegal: { color: COLORS.quiet, fontSize: 9 },
});
