import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "default",
      }}
    >
      <Stack.Screen name="index" />

      <Stack.Screen name="onboarding" />

      <Stack.Screen name="account" />

      <Stack.Screen name="goals" />

      <Stack.Screen name="focus" />

      <Stack.Screen name="legal" />

      <Stack.Screen name="help" />

      <Stack.Screen name="settings" />

      <Stack.Screen name="feedback" />

      <Stack.Screen name="rewards" />

      <Stack.Screen name="schedule" />

      <Stack.Screen name="accountability" />

      <Stack.Screen name="commitment" />

      <Stack.Screen name="plan" />

      <Stack.Screen name="daily" />

      <Stack.Screen name="learning" />

      <Stack.Screen name="quiz" />

      <Stack.Screen name="action" />

      <Stack.Screen name="project" />

      <Stack.Screen name="proof" />

      <Stack.Screen name="skilltree" />

      <Stack.Screen name="progress-screen" />
    </Stack>
  );
}
