import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const tab = (title: string, icon: IconName) => ({
  title,
  tabBarIcon: ({ color, size }: { color: string; size: number }) => <Ionicons name={icon} size={size} color={color} />,
});

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.line },
      }}
    >
      <Tabs.Screen name="index" options={tab('Home', 'home-outline')} />
      <Tabs.Screen name="food-log" options={tab('Food Log', 'restaurant-outline')} />
      <Tabs.Screen name="history" options={tab('History', 'calendar-outline')} />
      <Tabs.Screen name="profile" options={tab('Profile', 'person-outline')} />
    </Tabs>
  );
}
