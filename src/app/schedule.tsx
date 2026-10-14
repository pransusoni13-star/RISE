import React, { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BuilderHeader } from "../components/builder-ui";
import { useRiseAppearance } from "../services/appearance";
import { updateProfile } from "../services/personalization";
import { ReminderTime, setDailyReminders } from "../services/reminders";

const options = ["10 minutes", "20 minutes", "30 minutes", "60 minutes"];
const reminderTimes: { label: string; value: ReminderTime }[] = [
  { label: "8 AM", value: "08:00" }, { label: "12 PM", value: "12:00" },
  { label: "6 PM", value: "18:00" }, { label: "8 PM", value: "20:00" },
];

export default function ScheduleScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useRiseAppearance();
  const params = useLocalSearchParams();
  const existingTime = typeof params.availableTime === "string" ? params.availableTime : typeof params.time === "string" ? params.time : "";
  const [selected, setSelected] = useState(existingTime);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderCount, setReminderCount] = useState<1 | 2 | 3>(1);
  const [reminderTimesSelected, setReminderTimesSelected] = useState<ReminderTime[]>(["20:00"]);
  const [reminderMenuOpen, setReminderMenuOpen] = useState(false);

  const chooseReminderCount = (count: 1 | 2 | 3) => {
    const defaults: ReminderTime[] = ["08:00", "12:00", "20:00"];
    setReminderCount(count);
    setReminderTimesSelected((current) => {
      const next = [...current];
      for (const value of defaults) if (next.length < count && !next.includes(value)) next.push(value);
      return next.slice(0, count);
    });
  };

  const toggleReminderTime = (time: ReminderTime) => {
    setReminderTimesSelected((current) => {
      if (current.includes(time)) return current.length === 1 ? current : current.filter((value) => value !== time);
      if (current.length >= reminderCount) return [...current.slice(1), time];
      return [...current, time];
    });
  };

  const continueNext = async () => {
    if (!selected) return;
    await updateProfile({ availableTime: selected });
    if (reminderEnabled) {
      try {
        const reminder = await setDailyReminders(true, reminderTimesSelected);
        if (!reminder.enabled && reminder.permission !== "unavailable") Alert.alert("Reminder not enabled", "Allow notifications in your phone settings whenever you want RISE check-ins.");
      } catch {
        Alert.alert("Reminder not saved", "Your plan is safe. You can turn on a daily check-in later in Settings.");
      }
    }
    router.push({ pathname: "/plan", params: { ...params, time: selected, availableTime: selected } } as any);
  };

  return (
    <View style={[styles.page, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 130 }]} showsVerticalScrollIndicator={false}>
        <BuilderHeader step={3} onBack={() => router.back()} />
        <Text style={[styles.eyebrow, { color: theme.accent }]}>SET YOUR DAILY PACE</Text>
        <Text style={[styles.title, { color: theme.text }]}>How much time can you <Text style={{ color: theme.accent }}>protect?</Text></Text>
        <Text style={[styles.subtitle, { color: theme.muted }]}>Choose a realistic window. Every mission will fit inside it.</Text>

        <View style={styles.timeGrid}>{options.map((option) => {
          const active = selected === option;
          const minutes = option.split(" ")[0];
          return <Pressable key={option} accessibilityRole="radio" accessibilityState={{ selected: active }} onPress={() => setSelected(option)} style={[styles.timeCard, { backgroundColor: active ? theme.surfaceStrong : theme.surface, borderColor: active ? theme.accent : theme.border }]}>
            <Text style={[styles.minutes, { color: active ? theme.accent : theme.text }]}>{minutes}</Text><Text style={[styles.minutesLabel, { color: theme.muted }]}>MIN / DAY</Text>{active ? <View style={[styles.activeDot, { backgroundColor: theme.accent }]} /> : null}
          </Pressable>;
        })}</View>

        <View style={[styles.promise, { backgroundColor: theme.blueSurface, borderColor: theme.blueBorder }]}><Text style={[styles.promiseLabel, { color: theme.accent }]}>YOUR PROMISE</Text><Text style={[styles.promiseText, { color: theme.text }]}>{selected ? `${selected} of focused progress each day.` : "Pick the pace you can repeat, even on a busy day."}</Text></View>

        <Pressable accessibilityRole="switch" accessibilityState={{ checked: reminderEnabled }} onPress={() => setReminderEnabled((value) => !value)} style={[styles.reminderCard, { backgroundColor: theme.surface, borderColor: reminderEnabled ? theme.accent : theme.border }]}>
          <View style={styles.reminderCopy}><Text style={[styles.reminderTitle, { color: theme.text }]}>Keep me accountable</Text><Text style={[styles.reminderText, { color: theme.muted }]}>Optional phone check-ins at times you choose.</Text></View>
          <View style={[styles.switchTrack, { backgroundColor: reminderEnabled ? theme.accent : theme.border }]}><View style={[styles.switchKnob, { backgroundColor: reminderEnabled ? theme.accentInk : theme.text }, reminderEnabled && styles.switchKnobActive]} /></View>
        </Pressable>

        {reminderEnabled ? <View style={[styles.reminderPanel, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.fieldLabel, { color: theme.muted }]}>CHECK-INS PER DAY</Text>
          <View style={styles.countRow}>{([1, 2, 3] as const).map((count) => <Pressable key={count} accessibilityRole="radio" accessibilityState={{ selected: reminderCount === count }} onPress={() => chooseReminderCount(count)} style={[styles.countChip, { borderColor: reminderCount === count ? theme.accent : theme.border, backgroundColor: reminderCount === count ? theme.surfaceStrong : theme.background }]}><Text style={[styles.countChipText, { color: reminderCount === count ? theme.accent : theme.text }]}>{count}×</Text></Pressable>)}</View>
          <Text style={[styles.fieldLabel, { color: theme.muted }]}>REMINDER TIMES</Text>
          <Pressable accessibilityRole="button" accessibilityState={{ expanded: reminderMenuOpen }} onPress={() => setReminderMenuOpen((open) => !open)} style={[styles.dropdown, { backgroundColor: theme.background, borderColor: theme.border }]}><Text style={[styles.dropdownText, { color: theme.text }]}>{reminderTimes.filter((item) => reminderTimesSelected.includes(item.value)).map((item) => item.label).join(" · ")}</Text><Text style={[styles.dropdownArrow, { color: theme.accent }]}>{reminderMenuOpen ? "−" : "+"}</Text></Pressable>
          {reminderMenuOpen ? <View style={[styles.menu, { borderColor: theme.border }]}>{reminderTimes.map((item) => {
            const active = reminderTimesSelected.includes(item.value);
            return <Pressable key={item.value} accessibilityRole="checkbox" accessibilityState={{ checked: active }} onPress={() => toggleReminderTime(item.value)} style={[styles.menuItem, { backgroundColor: active ? theme.surfaceStrong : theme.background, borderBottomColor: theme.border }]}><Text style={[styles.menuText, { color: theme.text }]}>{active ? "✓  " : ""}{item.label}</Text></Pressable>;
          })}</View> : null}
          <Text style={[styles.finePrint, { color: theme.muted }]}>Notifications can be changed anytime in Settings.</Text>
        </View> : null}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.background }]}><Pressable accessibilityRole="button" accessibilityState={{ disabled: !selected }} disabled={!selected} onPress={continueNext} style={[styles.button, { backgroundColor: theme.accent }, !selected && styles.disabled]}><Text style={[styles.buttonText, { color: theme.accentInk }]}>Create my plan</Text></Pressable></View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 }, content: { paddingHorizontal: 22 }, eyebrow: { fontSize: 10, fontWeight: "900", letterSpacing: 1.4, marginBottom: 12 },
  title: { fontSize: 38, lineHeight: 43, fontWeight: "900", letterSpacing: -1.2 }, subtitle: { fontSize: 15, lineHeight: 22, fontWeight: "600", marginTop: 12, marginBottom: 22 },
  timeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 }, timeCard: { width: "47%", flexGrow: 1, minHeight: 126, borderRadius: 20, borderWidth: 1, padding: 16, justifyContent: "flex-end", position: "relative" }, minutes: { fontSize: 42, lineHeight: 45, fontWeight: "900", letterSpacing: -1.5 }, minutesLabel: { fontSize: 9, fontWeight: "900", letterSpacing: 1.1, marginTop: 4 }, activeDot: { position: "absolute", width: 10, height: 10, borderRadius: 5, right: 14, top: 14 },
  promise: { borderWidth: 1, borderRadius: 18, padding: 15, marginTop: 16 }, promiseLabel: { fontSize: 9, fontWeight: "900", letterSpacing: 1.1 }, promiseText: { fontSize: 14, lineHeight: 20, fontWeight: "800", marginTop: 5 },
  reminderCard: { minHeight: 82, borderRadius: 18, borderWidth: 1, padding: 15, marginTop: 20, flexDirection: "row", alignItems: "center" }, reminderCopy: { flex: 1 }, reminderTitle: { fontSize: 15, fontWeight: "900" }, reminderText: { fontSize: 12, lineHeight: 17, marginTop: 4, paddingRight: 10 },
  switchTrack: { width: 48, height: 28, borderRadius: 14, padding: 3, justifyContent: "center" }, switchKnob: { width: 22, height: 22, borderRadius: 11 }, switchKnobActive: { alignSelf: "flex-end" },
  reminderPanel: { borderRadius: 18, borderWidth: 1, padding: 15, marginTop: 10 }, fieldLabel: { fontSize: 9, fontWeight: "900", letterSpacing: 1.1, marginBottom: 9, marginTop: 5 }, countRow: { flexDirection: "row", gap: 8, marginBottom: 17 }, countChip: { flex: 1, height: 44, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" }, countChipText: { fontSize: 13, fontWeight: "900" },
  dropdown: { minHeight: 50, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, dropdownText: { fontSize: 13, fontWeight: "900" }, dropdownArrow: { fontSize: 22 }, menu: { borderWidth: 1, borderRadius: 14, overflow: "hidden", marginTop: 7 }, menuItem: { minHeight: 46, justifyContent: "center", paddingHorizontal: 14, borderBottomWidth: StyleSheet.hairlineWidth }, menuText: { fontSize: 13, fontWeight: "800" }, finePrint: { fontSize: 10, lineHeight: 15, marginTop: 10 },
  footer: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 22, paddingTop: 12, paddingBottom: 18 }, button: { minHeight: 58, borderRadius: 16, alignItems: "center", justifyContent: "center" }, buttonText: { fontSize: 15, fontWeight: "900" }, disabled: { opacity: 0.38 },
});
