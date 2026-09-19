import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { updateProfile } from "../services/personalization";

const options = [
  {
    emoji: "🌱",
    title: "Every 7 days",
    description: "Choose a fresh skill every week.",
  },
  {
    emoji: "🔥",
    title: "Every 10 days",
    description: "Give each skill a little more practice time.",
  },
  {
    emoji: "🚀",
    title: "Every 30 days",
    description: "Stay focused on one skill for a full 30-day cycle.",
  },
  {
    emoji: "🗓️",
    title: "Every month",
    description: "Pick a new skill at the start of each calendar month.",
  },
];

export default function CommitmentScreen() {
  const params = useLocalSearchParams();

  const existingCommitment =
    typeof params.commitment === "string"
      ? params.commitment
      : "";

  const [selected, setSelected] = useState(existingCommitment || "Every 7 days");

  const handleContinue = async () => {
    if (!selected) return;

    await updateProfile({ commitment: selected });

    router.push({
      pathname: "/plan",

      params: {
        // Original information
        goals: params.goals,
        time: params.time,
        availableTime: params.availableTime,
        accountability: params.accountability,
        commitment: selected,

        // Personalization information
        customGoal: params.customGoal,
        goalType: params.goalType,
        currentSituation: params.currentSituation,
        desiredOutcome: params.desiredOutcome,
        experience: params.experience,
        motivation: params.motivation,
      },
    } as any);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.progress}>05 / 05</Text>

        <Text style={styles.title}>
          How often do you want to{"\n"}
          <Text style={styles.greenText}>
            choose a new skill?
          </Text>
        </Text>

        <Text style={styles.subtitle}>
          RISE stays focused on one skill for this cycle, then helps you review
          your proof and choose what to learn next.
        </Text>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>
            One skill at a time
          </Text>

          <Text style={styles.infoText}>
            Your daily time stays the same. This only controls when RISE asks
            you to select a new skill.
          </Text>
        </View>

        <View style={styles.options}>
          {options.map((option) => {
            const isSelected = selected === option.title;

            return (
              <Pressable
                key={option.title}
                onPress={() => setSelected(option.title)}
                style={({ pressed }) => [
                  styles.option,
                  isSelected && styles.optionSelected,
                  pressed && styles.optionPressed,
                ]}
              >
                <View
                  style={[
                    styles.optionIcon,
                    isSelected && styles.optionIconSelected,
                  ]}
                >
                  <Text style={styles.emoji}>
                    {option.emoji}
                  </Text>
                </View>

                <View style={styles.optionContent}>
                  <Text
                    style={[
                      styles.optionTitle,
                      isSelected && styles.optionTitleSelected,
                    ]}
                  >
                    {option.title}
                  </Text>

                  <Text style={styles.description}>
                    {option.description}
                  </Text>
                </View>

                <View
                  style={[
                    styles.radio,
                    isSelected && styles.radioSelected,
                  ]}
                >
                  {isSelected && <View style={styles.radioDot} />}
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.bottomMessage}>
          <Text style={styles.messageEmoji}>🚀</Text>

          <View style={styles.messageContent}>
            <Text style={styles.messageTitle}>
              One final step.
            </Text>

            <Text style={styles.messageText}>
              RISE will use everything you've told us to
              build your personalized system.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          disabled={!selected}
          onPress={handleContinue}
          style={({ pressed }) => [
            styles.button,
            selected && styles.buttonActive,
            !selected && styles.buttonDisabled,
            pressed && selected && styles.buttonPressed,
          ]}
        >
          <Text
            style={[
              styles.buttonText,
              selected && styles.buttonTextActive,
            ]}
          >
            Build My RISE Plan
          </Text>

          <Text
            style={[
              styles.arrow,
              selected && styles.arrowActive,
            ]}
          >
            →
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#010807",
  },

  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 65,
    paddingBottom: 140,
  },

  progress: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 2,
    color: "#7AF5B8",
    marginBottom: 28,
  },

  title: {
    fontSize: 35,
    lineHeight: 41,
    fontWeight: "900",
    color: "#F5FFF9",
    marginBottom: 15,
  },

  greenText: {
    color: "#7AF5B8",
  },

  subtitle: {
    fontSize: 15,
    lineHeight: 23,
    color: "#C8EED9",
    marginBottom: 22,
  },

  infoCard: {
    backgroundColor: "rgba(122, 245, 184, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(122, 245, 184, 0.2)",
    borderRadius: 18,
    padding: 14,
    marginBottom: 22,
  },

  infoTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#7AF5B8",
    marginBottom: 4,
  },

  infoText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#DFFDEE",
  },

  options: {
    gap: 11,
  },

  option: {
    minHeight: 78,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: "#1E3A31",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#071B16",
    elevation: 2,
  },

  optionSelected: {
    borderColor: "#7AF5B8",
    backgroundColor: "#0D2F22",
    elevation: 4,
  },

  optionPressed: {
    opacity: 0.8,
  },

  optionIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#11382B",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  optionIconSelected: {
    backgroundColor: "#071B16",
  },

  emoji: {
    fontSize: 23,
  },

  optionContent: {
    flex: 1,
  },

  optionTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#F5FFF9",
    marginBottom: 3,
  },

  optionTitleSelected: {
    color: "#7AF5B8",
    fontWeight: "900",
  },

  description: {
    fontSize: 12,
    lineHeight: 17,
    color: "#B4D4C2",
  },

  radio: {
    width: 23,
    height: 23,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#4B695E",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },

  radioSelected: {
    borderColor: "#7AF5B8",
  },

  radioDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: "#7AF5B8",
  },

  bottomMessage: {
    marginTop: 20,
    padding: 16,
    borderRadius: 19,
    backgroundColor: "#0D2F22",
    borderWidth: 1,
    borderColor: "#1E3A31",
    flexDirection: "row",
    alignItems: "center",
  },

  messageEmoji: {
    fontSize: 29,
    marginRight: 13,
  },

  messageContent: {
    flex: 1,
  },

  messageTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#F5FFF9",
    marginBottom: 4,
  },

  messageText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#C8EED9",
  },

  footer: {
    position: "absolute",
    left: 24,
    right: 24,
    bottom: 24,
  },

  button: {
    height: 60,
    borderRadius: 30,
    backgroundColor: "#1B2B26",
    borderWidth: 1,
    borderColor: "rgba(122, 245, 184, 0.2)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000000",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 6,
    },
  },

  buttonActive: {
    backgroundColor: "#7AF5B8",
    borderColor: "#7AF5B8",
    elevation: 6,
  },

  buttonDisabled: {
    backgroundColor: "#1B2B26",
    borderColor: "#4D665D",
    opacity: 0.85,
  },

  buttonPressed: {
    opacity: 0.9,
  },

  buttonText: {
    color: "#7AF5B8",
    fontSize: 17,
    fontWeight: "900",
  },

  buttonTextActive: {
    color: "#010807",
  },

  arrow: {
    color: "#7AF5B8",
    fontSize: 22,
    marginLeft: 10,
  },

  arrowActive: {
    color: "#010807",
  },
});
