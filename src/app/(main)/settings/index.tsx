import { Link, router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/store/authStore';

const MENU: {
  href: '/settings/profile' | '/settings/categories' | '/settings/cards' | '/settings/household' | '/settings/import';
  label: string;
  description: string;
}[] = [
  { href: '/settings/profile', label: '마이페이지', description: '생년월일 등 내 정보를 수정해요' },
  { href: '/settings/categories', label: '카테고리 관리', description: '수입/지출 카테고리를 추가하고 관리해요' },
  { href: '/settings/cards', label: '카드 관리', description: '사용하는 카드/계좌를 등록해요' },
  { href: '/settings/household', label: '가계부 정보', description: '초대 코드와 구성원을 확인해요' },
  { href: '/settings/import', label: '명세서 가져오기', description: '카드사 엑셀 명세서로 거래를 한 번에 등록해요' },
];

export default function SettingsScreen() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = async () => {
    await logout();
    queryClient.clear();
    router.replace('/login');
  };

  return (
    <Screen>
      {user ? (
        <Text className="text-slate-500 dark:text-slate-400">
          {user.name} ({user.email})
        </Text>
      ) : null}

      <View className="gap-3">
        {MENU.map((item) => (
          <Link key={item.href} href={item.href} asChild>
            <Pressable className="gap-1 rounded-xl bg-white p-4 dark:bg-slate-900">
              <Text className="text-base font-semibold text-slate-900 dark:text-white">{item.label}</Text>
              <Text className="text-sm text-slate-500 dark:text-slate-400">{item.description}</Text>
            </Pressable>
          </Link>
        ))}
      </View>

      <Pressable onPress={handleLogout} className="items-center rounded-xl bg-slate-200 p-4 dark:bg-slate-800">
        <Text className="font-semibold text-slate-700 dark:text-slate-200">로그아웃</Text>
      </Pressable>
    </Screen>
  );
}
