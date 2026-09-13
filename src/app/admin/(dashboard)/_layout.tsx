import { Ionicons } from '@expo/vector-icons';
import { Redirect, router, Slot, usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useIsDesktop } from '@/lib/responsive';
import { useGoHome } from '@/lib/useGoHome';
import { useAdminAuthStore } from '@/store/adminAuthStore';
import { useAuthStore } from '@/store/authStore';

const TAGLINE_ASPECT_RATIO = 619 / 1295;

const NAV: {
  href: '/admin' | '/admin/users' | '/admin/households' | '/admin/feature-requests';
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { href: '/admin', label: '대시보드', icon: 'grid-outline' },
  { href: '/admin/users', label: '회원', icon: 'people-outline' },
  { href: '/admin/households', label: '가계부', icon: 'wallet-outline' },
  { href: '/admin/feature-requests', label: '기능 요청', icon: 'chatbox-ellipses-outline' },
];

export default function AdminDashboardLayout() {
  const accessToken = useAdminAuthStore((state) => state.accessToken);
  const hydrated = useAdminAuthStore((state) => state.hydrated);
  const hydrate = useAdminAuthStore((state) => state.hydrate);
  const logout = useAdminAuthStore((state) => state.logout);
  const mainLogout = useAuthStore((state) => state.logout);
  const pathname = usePathname();
  const goHome = useGoHome();
  const isDesktop = useIsDesktop();
  const insets = useSafeAreaInsets();
  const [hydrationStarted, setHydrationStarted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!hydrationStarted) {
      setHydrationStarted(true);
      hydrate();
    }
  }, [hydrationStarted, hydrate]);

  if (!hydrated) {
    return (
      <View className="flex-1 items-center justify-center bg-primary-dark">
        <ActivityIndicator color="#ffffff" />
      </View>
    );
  }

  if (!accessToken) {
    return <Redirect href="/admin/login" />;
  }

  const handleLogout = async () => {
    // 이 토큰은 일반 계정 로그인에서 그대로 흘러들어왔을 수도 있어서, 어드민 화면에서
    // 로그아웃하면 일반 앱 세션도 같이 정리한다 — 안 그러면 "로그아웃" 눌러도 실제로는
    // 여전히 로그인 상태로 남아있게 된다.
    await Promise.all([logout(), mainLogout()]);
    router.replace('/admin/login');
  };

  const isActive = (href: (typeof NAV)[number]['href']) =>
    href === '/admin' ? pathname === href : pathname.startsWith(href);

  return (
    <View className="flex-1 bg-slate-100">
      <View className="bg-primary-dark px-4 pb-4 pt-6 md:px-8 md:pt-8">
        <View className="mx-auto w-full max-w-[1100px] flex-row items-center justify-between">
          {isDesktop ? (
            <>
              <View className="flex-row items-center gap-8">
                <Pressable onPress={() => router.push('/admin')} className="flex-row items-center gap-3">
                  <Image
                    source={require('../../../../assets/marketing/brand-tagline-white.png')}
                    accessibilityLabel="BOSU Ledger — Spend less, Keep more"
                    resizeMode="contain"
                    style={{ width: 110, height: 110 * TAGLINE_ASPECT_RATIO }}
                  />
                  <View className="rounded-full bg-white/15 px-2.5 py-1">
                    <Text className="text-xs font-semibold text-white/90">관리자</Text>
                  </View>
                </Pressable>
                <View className="flex-row gap-1.5">
                  {NAV.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <Pressable
                        key={item.href}
                        onPress={() => router.push(item.href)}
                        className={`flex-row items-center gap-1.5 rounded-full px-4 py-2 ${active ? 'bg-white' : ''}`}>
                        <Ionicons name={item.icon} size={15} color={active ? '#082B29' : '#ffffffb3'} />
                        <Text className={`text-sm font-semibold ${active ? 'text-primary-dark' : 'text-white/70'}`}>
                          {item.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
              <View className="flex-row items-center gap-1">
                <Pressable onPress={goHome} className="flex-row items-center gap-1.5 px-2 py-2">
                  <Ionicons name="arrow-back-outline" size={16} color="#ffffffb3" />
                  <Text className="text-sm font-medium text-white/70">앱으로 돌아가기</Text>
                </Pressable>
                <Pressable onPress={handleLogout} className="flex-row items-center gap-1.5 px-2 py-2">
                  <Ionicons name="log-out-outline" size={16} color="#ffffffb3" />
                  <Text className="text-sm font-medium text-white/70">로그아웃</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <Pressable onPress={() => router.push('/admin')} hitSlop={8}>
                <Image
                  source={require('../../../../assets/marketing/brand-tagline-white.png')}
                  accessibilityLabel="BOSU Ledger — Spend less, Keep more"
                  resizeMode="contain"
                  style={{ width: 84, height: 84 * TAGLINE_ASPECT_RATIO }}
                />
              </Pressable>
              <Pressable
                onPress={() => setMenuOpen(true)}
                hitSlop={8}
                className="h-9 w-9 items-center justify-center rounded-full bg-white/15">
                <Ionicons name="menu" size={20} color="#ffffff" />
              </Pressable>
            </>
          )}
        </View>
      </View>
      <Slot />

      {!isDesktop ? (
        <Modal visible={menuOpen} animationType="fade" transparent onRequestClose={() => setMenuOpen(false)}>
          <Pressable className="flex-1 bg-black/30" onPress={() => setMenuOpen(false)}>
            <Pressable
              onPress={(e) => e.stopPropagation()}
              style={{ paddingBottom: insets.bottom + 16 }}
              className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-white p-4">
              <View className="items-center pb-3">
                <View className="h-1 w-10 rounded-full bg-slate-200" />
              </View>
              <View className="gap-1">
                {NAV.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Pressable
                      key={item.href}
                      onPress={() => {
                        setMenuOpen(false);
                        router.push(item.href);
                      }}
                      className={`flex-row items-center gap-3 rounded-xl px-3 py-3 ${active ? 'bg-primary-light' : ''}`}>
                      <Ionicons name={item.icon} size={18} color={active ? '#105753' : '#64748b'} />
                      <Text className={`text-sm font-semibold ${active ? 'text-primary' : 'text-slate-700'}`}>
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <View className="my-2 h-px bg-slate-100" />
              <Pressable
                onPress={() => {
                  setMenuOpen(false);
                  goHome();
                }}
                className="flex-row items-center gap-3 rounded-xl px-3 py-3">
                <Ionicons name="arrow-back-outline" size={18} color="#64748b" />
                <Text className="text-sm font-medium text-slate-700">앱으로 돌아가기</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setMenuOpen(false);
                  handleLogout();
                }}
                className="flex-row items-center gap-3 rounded-xl px-3 py-3">
                <Ionicons name="log-out-outline" size={18} color="#64748b" />
                <Text className="text-sm font-medium text-slate-700">로그아웃</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}
