import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/store/authStore';

export default function LogoutScreen() {
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    (async () => {
      await logout();
      queryClient.clear();
      router.replace('/login');
    })();
  }, [logout]);

  return (
    <View className="flex-1 items-center justify-center bg-cream dark:bg-slate-950">
      <ActivityIndicator size="large" />
    </View>
  );
}
