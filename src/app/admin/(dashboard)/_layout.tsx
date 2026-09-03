import { Ionicons } from '@expo/vector-icons';
import { Redirect, router, Slot, usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { useAdminAuthStore } from '@/store/adminAuthStore';
import { useAuthStore } from '@/store/authStore';

/** assets/brand/logo-mono.svg를 그대로 옮긴 마크 — 어두운 배경용 흰색/반투명 배색. */
function BrandMark({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 1024 1024">
      <Path
        d="M512 214 C524 214 535 219 544 228 L 772 442 C 784 453 790 468 790 484 L 790 744 C 790 768 770 788 746 788 L 278 788 C 254 788 234 768 234 744 L 234 484 C 234 468 240 453 252 442 L 480 228 C 489 219 500 214 512 214 Z"
        fill="#ffffff"
      />
      <Circle cx={512} cy={628} r={132} fill="#ffffff" fillOpacity={0.55} />
    </Svg>
  );
}

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
  const [hydrationStarted, setHydrationStarted] = useState(false);

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

  return (
    <View className="flex-1 bg-slate-100">
      <View className="bg-primary-dark px-6 pb-4 pt-6 md:px-8 md:pt-8">
        <View className="mx-auto w-full max-w-[1100px] flex-row items-center justify-between">
          <View className="flex-row items-center gap-8">
            <View className="flex-row items-center gap-2.5">
              <BrandMark />
              <View className="flex-row items-baseline gap-1">
                <Text className="font-brand text-lg tracking-wide text-white">BOSU</Text>
                <Text className="text-lg font-light text-white/55">Ledger</Text>
              </View>
              <View className="rounded-full bg-white/15 px-2.5 py-1">
                <Text className="text-xs font-semibold text-white/90">관리자</Text>
              </View>
            </View>
            <View className="flex-row gap-1.5">
              {NAV.map((item) => {
                const active = item.href === '/admin' ? pathname === item.href : pathname.startsWith(item.href);
                return (
                  <Pressable
                    key={item.href}
                    onPress={() => router.push(item.href)}
                    className={`flex-row items-center gap-1.5 rounded-full px-4 py-2 ${active ? 'bg-white' : ''}`}>
                    <Ionicons name={item.icon} size={15} color={active ? '#01003D' : '#ffffffb3'} />
                    <Text className={`text-sm font-semibold ${active ? 'text-primary-dark' : 'text-white/70'}`}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <Pressable onPress={handleLogout} className="flex-row items-center gap-1.5 px-2 py-2">
            <Ionicons name="log-out-outline" size={16} color="#ffffffb3" />
            <Text className="text-sm font-medium text-white/70">로그아웃</Text>
          </Pressable>
        </View>
      </View>
      <Slot />
    </View>
  );
}
