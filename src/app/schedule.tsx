import React, { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { updateProfile } from "../services/personalization";
import { ReminderTime, setDailyReminder } from "../services/reminders";

const options = [
  "10 minutes",
  "20 minutes",
  "30 minutes",
  "60 minutes",
];
const reminderTimes: { label: string; value: ReminderTime }[] = [
  { label: "8 AM", value: "08:00" },
  { label: "12 PM", value: "12:00" },
  { label: "6 PM", value: "18:00" },
  { label: "8 PM", value: "20:00" },
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
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState<ReminderTime>("20:00");

  const continueNext = async () => {
    if (!selected) return;

    await updateProfile({ availableTime: selected });
    if (reminderEnabled) {
      try {
        const reminder = await setDailyReminder(true, reminderTime);
        if (!reminder.enabled && reminder.permission !== "unavailable") {
          Alert.alert("Reminder not enabled", "Allow notifications in your phone settings whenever you want RISE check-ins.");
        }
      } catch {
        Alert.alert("Reminder not saved", "Your plan is safe. You can turn on a daily check-in later in Settings.");
      }
    }

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
        <View style={styles.headerRow}><Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable><Text style={styles.progress}>03 / 03</Text></View>

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

        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: reminderEnabled }}
          onPress={() => setReminderEnabled((value) => !value)}
          style={[styles.reminderCard, reminderEnabled && styles.reminderCardActive]}
        >
          <View style={styles.reminderCopy}>
            <Text style={styles.reminderTitle}>Keep me accountable</Text>
            <Text style={styles.reminderText}>One optional daily phone reminder to finish your mission and earn XP + coins.</Text>
          </View>
          <View style={[styles.switchTrack, reminderEnabled && styles.switchTrackActive]}><View style={[styles.switchKnob, reminderEnabled && styles.switchKnobActive]} /></View>
        </Pressable>

        {reminderEnabled && (
          <View style={styles.reminderTimes}>
            <Text style={styles.reminderTimesTitle}>Choose your daily check-in</Text>
            <View style={styles.reminderTimesRow}>
              {reminderTimes.map((item) => (
                <Pressable key={item.value} accessibilityRole="radio" accessibilityState={{ selected: reminderTime === item.value }} onPress={() => setReminderTime(item.value)} style={[styles.timeChip, reminderTime === item.value && styles.timeChipActive]}>
                  <Text style={[styles.timeChipText, reminderTime === item.value && styles.timeChipTextActive]}>{item.label}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.reminderFinePrint}>Phone settings, Focus mode, and battery rules can delay alerts. You stay in control and can turn this off in Settings.</Text>
          </View>
        )}
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

  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 28 },
  back: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: "#29483B", alignItems: "center", justifyContent: "center" },
  backText: { color: "#7AF5B8", fontSize: 28, marginTop: -4 },

  progress: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 2,
    color: "#7AF5B8",
    marginBottom: 0,
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
  reminderCard: { marginTop: 24, minHeight: 86, borderRadius: 18, borderWidth: 1.5, borderColor: "#1E3A31", backgroundColor: "#071B16", padding: 16, flexDirection: "row", alignItems: "center", gap: 14 },
  reminderCardActive: { borderColor: "#7AF5B8", backgroundColor: "#11382B" },
  reminderCopy: { flex: 1 },
  reminderTitle: { color: "#F5FFF9", fontSize: 15, fontWeight: "900", marginBottom: 5 },
  reminderText: { color: "#C8EED9", fontSize: 12, lineHeight: 18 },
  switchTrack: { width: 48, height: 28, borderRadius: 14, backgroundColor: "#345247", padding: 3, justifyContent: "center" },
  switchTrackActive: { backgroundColor: "#7AF5B8" },
  switchKnob: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#F5FFF9" },
  switchKnobActive: { alignSelf: "flex-end", backgroundColor: "#010807" },
  reminderTimes: { marginTop: 12, borderRadius: 18, borderWidth: 1, borderColor: "#1E3A31", padding: 14, backgroundColor: "#071B16" },
  reminderTimesTitle: { color: "#F5FFF9", fontSize: 13, fontWeight: "900", marginBottom: 10 },
  reminderTimesRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  timeChip: { minWidth: 60, minHeight: 42, borderRadius: 999, borderWidth: 1, borderColor: "#345247", alignItems: "center", justifyContent: "center", paddingHorizontal: 12 },
  timeChipActive: { backgroundColor: "#7AF5B8", borderColor: "#7AF5B8" },
  timeChipText: { color: "#DFFDEE", fontSize: 12, fontWeight: "800" },
  timeChipTextActive: { color: "#010807" },
  reminderFinePrint: { color: "#8FB6A2", fontSize: 11, lineHeight: 16, marginTop: 10 },

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
