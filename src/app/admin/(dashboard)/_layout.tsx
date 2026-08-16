import { Redirect, router, Slot, usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { useAdminAuthStore } from '@/store/adminAuthStore';

const NAV: { href: '/admin' | '/admin/users' | '/admin/households'; label: string }[] = [
  { href: '/admin', label: '대시보드' },
  { href: '/admin/users', label: '회원' },
  { href: '/admin/households', label: '가계부' },
];

export default function AdminDashboardLayout() {
  const accessToken = useAdminAuthStore((state) => state.accessToken);
  const hydrated = useAdminAuthStore((state) => state.hydrated);
  const hydrate = useAdminAuthStore((state) => state.hydrate);
  const logout = useAdminAuthStore((state) => state.logout);
  const pathname = usePathname();
  const [hydrationStarted, setHydrationStarted] = useState(false);

  useEffect(() => {
    if (!hydrationStarted) {
      setHydrationStarted(true);
      hydrate();
    }
  }, [hydrationStarted, hydrate]);

  if (!hydrated) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-950">
        <ActivityIndicator color="#ffffff" />
      </View>
    );
  }

  if (!accessToken) {
    return <Redirect href="/admin/login" />;
  }

  const handleLogout = async () => {
    await logout();
    router.replace('/admin/login');
  };

  return (
    <View className="flex-1 bg-slate-950">
      <View className="flex-row items-center justify-between border-b border-slate-800 px-6 py-4">
        <View className="flex-row items-center gap-6">
          <Text className="text-base font-bold text-white">보수가계부 관리자</Text>
          {NAV.map((item) => (
            <Pressable key={item.href} onPress={() => router.push(item.href)}>
              <Text className={`text-sm font-medium ${pathname === item.href ? 'text-white' : 'text-slate-500'}`}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <Pressable onPress={handleLogout}>
          <Text className="text-sm text-slate-400">로그아웃</Text>
        </Pressable>
      </View>
      <Slot />
    </View>
  );
}
