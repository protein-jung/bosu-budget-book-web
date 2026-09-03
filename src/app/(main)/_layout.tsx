import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { MobileHeader } from '@/components/MobileHeader';
import { TopNav } from '@/components/TopNav';
import { useMyHousehold } from '@/features/household/api';
import { HouseholdOnboarding } from '@/features/household/HouseholdOnboarding';
import { useIsDesktop } from '@/lib/responsive';
import { useAuthStore } from '@/store/authStore';

export default function MainLayout() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAdmin = useAuthStore((state) => state.user?.isAdmin ?? false);
  const householdQuery = useMyHousehold();
  const isDesktop = useIsDesktop();

  if (!accessToken) {
    return <Redirect href="/login" />;
  }

  if (householdQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-cream">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!householdQuery.data) {
    return <HouseholdOnboarding />;
  }

  return (
    <View className="flex-1">
      {isDesktop ? <TopNav /> : <MobileHeader />}
      <Tabs screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}>
        <Tabs.Screen name="calendar" options={{ title: '달력' }} />
        <Tabs.Screen name="statistics" options={{ title: '통계' }} />
        <Tabs.Screen name="budget" options={{ title: '예산' }} />
        <Tabs.Screen name="portfolio" options={{ title: '자산' }} />
        <Tabs.Screen name="settings" options={{ title: '설정' }} />
        {isAdmin ? <Tabs.Screen name="admin" options={{ title: '관리자' }} /> : null}
      </Tabs>
    </View>
  );
}
