import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useMyHousehold } from '@/features/household/api';
import { HouseholdOnboarding } from '@/features/household/HouseholdOnboarding';
import { useAuthStore } from '@/store/authStore';

export default function MainLayout() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const householdQuery = useMyHousehold();

  if (!accessToken) {
    return <Redirect href="/login" />;
  }

  if (householdQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-slate-950">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!householdQuery.data) {
    return <HouseholdOnboarding />;
  }

  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#2563eb' }}>
      <Tabs.Screen
        name="calendar"
        options={{
          title: '달력',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="statistics"
        options={{
          title: '통계',
          tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '설정',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
