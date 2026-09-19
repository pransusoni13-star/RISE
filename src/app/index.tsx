import { StyleSheet, Text, View, Pressable } from "react-native";
import { router } from "expo-router";

export default function HomeScreen() {
  const handleStart = () => {
    router.push("/account" as any);
  };

  return (
    <View style={styles.container}>
      <View style={styles.glowOne} />
      <View style={styles.glowTwo} />

      <View style={styles.card}>
        <Text style={styles.badge}>YOUR DAILY RISE</Text>
        <Text style={styles.logo}>RISE</Text>

        <Text style={styles.title}>Build the version of you that sticks.</Text>

        <Text style={styles.subtitle}>
          Turn goals into routines, routines into momentum, and momentum into
          lasting progress.
        </Text>

        <View style={styles.featureRow}>
          <Text style={styles.feature}>📈 Consistency</Text>
          <Text style={styles.feature}>🎯 Focus</Text>
          <Text style={styles.feature}>💪 Momentum</Text>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleStart}
        >
          <Text style={styles.buttonText}>Start Your Journey</Text>
        </Pressable>
        <View style={styles.quickLinks}>
          <Pressable onPress={() => router.push("/feedback" as any)} style={styles.quickLink}><Text style={styles.quickLinkTitle}>Improve RISE</Text><Text style={styles.quickLinkText}>Send feedback</Text></Pressable>
          <Pressable onPress={() => router.push("/rewards" as any)} style={styles.quickLink}><Text style={styles.quickLinkTitle}>Rewards</Text><Text style={styles.quickLinkText}>See what coins unlock</Text></Pressable>
        </View>
        <View style={styles.supportLinks}>
          <Pressable onPress={() => router.push("/help" as any)} style={styles.legalLink}><Text style={styles.legalText}>Help Center</Text></Pressable>
          <Pressable onPress={() => router.push("/legal" as any)} style={styles.legalLink}><Text style={styles.legalText}>Privacy & Safety</Text></Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    backgroundColor: "#010807",
  },

  glowOne: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "#7AF5B8",
    opacity: 0.12,
    top: -160,
    right: -80,
  },

  glowTwo: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "#7AF5B8",
    opacity: 0.12,
    bottom: -160,
    left: -80,
  },

  card: {
    width: "100%",
    maxWidth: 430,
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderRadius: 32,
    backgroundColor: "#071B16",
    borderWidth: 1,
    borderColor: "rgba(122, 245, 184, 0.28)",
    elevation: 12,
    shadowColor: "#7AF5B8",
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 16 },
  },

  badge: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
    color: "#7AF5B8",
    marginBottom: 12,
    textTransform: "uppercase",
  },

  logo: {
    fontSize: 54,
    fontWeight: "900",
    letterSpacing: 10,
    marginBottom: 20,
    color: "#7AF5B8",
  },

  title: {
    fontSize: 32,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 14,
    color: "#F4FFF8",
  },

  subtitle: {
    fontSize: 17,
    lineHeight: 25,
    textAlign: "center",
    marginBottom: 24,
    color: "#D3F5E3",
  },

  featureRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginBottom: 30,
  },

  feature: {
    fontSize: 12,
    fontWeight: "700",
    color: "#7AF5B8",
    backgroundColor: "rgba(122, 245, 184, 0.1)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(122, 245, 184, 0.2)",
  },

  button: {
    width: "100%",
    paddingVertical: 17,
    borderRadius: 30,
    alignItems: "center",
    backgroundColor: "#7AF5B8",
    elevation: 6,
    shadowColor: "#7AF5B8",
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },

  buttonPressed: {
    opacity: 0.9,
  },

  buttonText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#010807",
  },
  legalLink: { paddingTop: 18, paddingHorizontal: 16 },
  legalText: { color: "#8FB6A2", fontSize: 12, fontWeight: "700" },
  supportLinks: { flexDirection: "row", justifyContent: "center" },
  quickLinks: { width: "100%", flexDirection: "row", gap: 9, marginTop: 12 },
  quickLink: { flex: 1, minHeight: 62, borderRadius: 16, borderWidth: 1, borderColor: "#29483B", backgroundColor: "#0D2F22", padding: 11, justifyContent: "center" },
  quickLinkTitle: { color: "#F5FFF9", fontSize: 12, fontWeight: "900" },
  quickLinkText: { color: "#8FB6A2", fontSize: 9, marginTop: 3 },
});
