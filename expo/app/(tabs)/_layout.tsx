import { Tabs } from "expo-router";
import { Home, Dumbbell, BarChart3, User, Target } from "lucide-react-native";
import React from "react";

import { useTranslation } from "@/hooks/useTranslation";
import { useTheme } from "@/hooks/useTheme";

export default function TabLayout() {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.dark.accent,
        tabBarInactiveTintColor: theme.dark.textSecondary,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.dark.surface,
          borderTopColor: theme.dark.border,
          borderTopWidth: 1,
          height: 85,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600' as const,
          marginBottom: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.tabs.home,
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="workouts"
        options={{
          title: t.tabs.workouts,
          tabBarIcon: ({ color, size }) => <Dumbbell color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: t.tabs.goals,
          tabBarIcon: ({ color, size }) => <Target color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: t.tabs.stats,
          tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t.tabs.profile,
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="muscles"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
