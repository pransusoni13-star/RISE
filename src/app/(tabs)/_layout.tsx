import { Tabs } from "expo-router";
import { Text } from "react-native";

const icon = (emoji: string) => <Text style={{ fontSize: 19, lineHeight: 25 }} accessibilityElementsHidden>{emoji}</Text>;

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#071B16",
          borderTopColor: "#1E3A31",
          borderTopWidth: 1,
          height: 76,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: "#7AF5B8",
        tabBarInactiveTintColor: "#B4D4C2",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "800",
        },
      }}
    >
      <Tabs.Screen
        name="today"
        options={{
          title: "Today",
          tabBarLabel: "Today",
          tabBarIcon: () => icon("☀️"),
        }}
      />

      <Tabs.Screen
        name="learn"
        options={{
          title: "Learn",
          tabBarLabel: "Learn",
          tabBarIcon: () => icon("📖"),
        }}
      />

      <Tabs.Screen
        name="missions"
        options={{
          title: "Missions",
          tabBarLabel: "Missions",
          tabBarIcon: () => icon("🎯"),
        }}
      />

      <Tabs.Screen
        name="projects"
        options={{
          title: "Projects",
          tabBarLabel: "Projects",
          tabBarIcon: () => icon("🛠️"),
        }}
      />

      <Tabs.Screen
        name="progress"
        options={{
          title: "Progress",
          tabBarLabel: "Progress",
          tabBarIcon: () => icon("📈"),
        }}
      />
    </Tabs>
  );
}
