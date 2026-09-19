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
  "10 minutes",
  "20 minutes",
  "30 minutes",
  "60 minutes",
];

export default function ScheduleScreen() {
  const params = useLocalSearchParams();

  const existingTime =
    typeof params.availableTime === "string"
      ? params.availableTime
      : typeof params.time === "string"
      ? params.time
      : "";

  const [selected, setSelected] = useState(existingTime);

  const continueNext = async () => {
    if (!selected) return;

    await updateProfile({ availableTime: selected });

    router.push({
      pathname: "/plan",
      params: {
        // Original information
        goals: params.goals,

        // Schedule information
        time: selected,
        availableTime: selected,

        // Personalization information
        customGoal: params.customGoal,
        goalType: params.goalType,
        currentSituation: params.currentSituation,
        desiredOutcome: params.desiredOutcome,
        experience: params.experience,
        motivation: params.motivation,
        weeklySkill: params.weeklySkill,
        focusSkills: params.focusSkills,
        skillStartDate: params.skillStartDate,
        commitment: params.commitment,
        spiritualTradition: params.spiritualTradition,
        trustedSources: params.trustedSources,
      },
    } as any);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.progress}>03 / 03</Text>

        <Text style={styles.title}>
          How much time can you{"\n"}
          <Text style={styles.green}>invest today?</Text>
        </Text>

        <Text style={styles.subtitle}>
          Choose once. Every mission in your selected cycle will fit this daily
          window, and you can change it later.
        </Text>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Your pace matters</Text>

          <Text style={styles.infoText}>
            Pick a rhythm you can realistically sustain so your plan feels
            exciting, not overwhelming.
          </Text>
        </View>

        <View style={styles.options}>
          {options.map((option) => {
            const isSelected = selected === option;

            return (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                key={option}
                onPress={() => setSelected(option)}
                style={[
                  styles.option,
                  isSelected && styles.optionSelected,
                ]}
              >
                <View
                  style={[
                    styles.radio,
                    isSelected && styles.radioSelected,
                  ]}
                >
                  {isSelected && <View style={styles.radioDot} />}
                </View>

                <Text
                  style={[
                    styles.optionText,
                    isSelected && styles.optionTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !selected }}
          disabled={!selected}
          onPress={continueNext}
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
            Continue
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
    paddingBottom: 120,
  },

  progress: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 2,
    color: "#7AF5B8",
    marginBottom: 28,
  },

  title: {
    fontSize: 36,
    lineHeight: 42,
    fontWeight: "900",
    color: "#F5FFF9",
    marginBottom: 15,
  },

  green: {
    color: "#7AF5B8",
  },

  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: "#C8EED9",
    marginBottom: 24,
  },

  infoCard: {
    backgroundColor: "rgba(122, 245, 184, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(122, 245, 184, 0.2)",
    borderRadius: 18,
    padding: 14,
    marginBottom: 24,
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
    gap: 12,
  },

  option: {
    minHeight: 64,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#1E3A31",
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#071B16",
    elevation: 2,
  },

  optionSelected: {
    borderColor: "#7AF5B8",
    backgroundColor: "#11382B",
    elevation: 4,
  },

  radio: {
    width: 23,
    height: 23,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#5C8171",
    marginRight: 14,
    alignItems: "center",
    justifyContent: "center",
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

  optionText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#F5FFF9",
  },

  optionTextSelected: {
    color: "#7AF5B8",
    fontWeight: "900",
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
