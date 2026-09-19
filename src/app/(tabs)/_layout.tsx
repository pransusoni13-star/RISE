import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#071B16",
          borderTopColor: "#1E3A31",
          borderTopWidth: 1,
          height: 72,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: "#7AF5B8",
        tabBarInactiveTintColor: "#B4D4C2",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
        },
      }}
    >
      <Tabs.Screen
        name="today"
        options={{
          title: "Today",
          tabBarLabel: "Today",
        }}
      />

      <Tabs.Screen
        name="learn"
        options={{
          title: "Learn",
          tabBarLabel: "Learn",
        }}
      />

      <Tabs.Screen
        name="missions"
        options={{
          title: "Missions",
          tabBarLabel: "Missions",
        }}
      />

      <Tabs.Screen
        name="projects"
        options={{
          title: "Projects",
          tabBarLabel: "Projects",
        }}
      />

      <Tabs.Screen
        name="progress"
        options={{
          title: "Progress",
          tabBarLabel: "Progress",
        }}
      />
    </Tabs>
  );
}
