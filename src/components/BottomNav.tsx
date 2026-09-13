import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTransactionModalStore } from '@/store/transactionModalStore';

/** BottomNav가 화면 아래를 가리는 높이 — Screen이 콘텐츠 하단 여백으로 그대로 가져다 쓴다.
 * 화면 가장자리에 딱 붙는 막대 대신 살짝 띄운 알약 모양 카드라서, 카드 높이(약 56)에 아래
 * 여백(12)까지 더한 값이다. */
export const BOTTOM_NAV_CONTENT_HEIGHT = 72;

type NavItem = {
  href: '/calendar' | '/statistics' | '/portfolio' | '/settings';
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
};

const LEFT_ITEMS: NavItem[] = [
  { href: '/calendar', label: '캘린더', icon: 'calendar-outline', activeIcon: 'calendar' },
  { href: '/statistics', label: '통계', icon: 'stats-chart-outline', activeIcon: 'stats-chart' },
];

const RIGHT_ITEMS: NavItem[] = [
  { href: '/portfolio', label: '자산', icon: 'wallet-outline', activeIcon: 'wallet' },
  { href: '/settings', label: '설정', icon: 'settings-outline', activeIcon: 'settings' },
];

function NavButton({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Pressable
      onPress={() => router.push(item.href)}
      className="flex-1 items-center justify-center gap-0.5 py-2">
      <Ionicons name={active ? item.activeIcon : item.icon} size={21} color={active ? '#105753' : '#94a3b8'} />
      <Text className={`text-[10px] font-medium ${active ? 'text-primary' : 'text-slate-400'}`}>{item.label}</Text>
    </Pressable>
  );
}

/** 모바일 전용 하단 메뉴바 — 캘린더/통계/+(내역 추가)/자산/설정 5개 아이콘. 화면 가장자리에
 * 딱 붙는 흰 막대 대신, 좌우로 살짝 띄우고 그림자를 준 알약 모양 카드로 떠 있게 해서 앱 전체의
 * 카드 기반 화면 톤과 어울리게 한다. 예산은 여기 없고 설정 화면 안의 메뉴로 옮겼다. */
export function BottomNav() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const openTransactionModal = useTransactionModalStore((state) => state.open);

  return (
    <View
      pointerEvents="box-none"
      style={{ paddingBottom: insets.bottom + 10 }}
      className="absolute inset-x-0 bottom-0 items-center px-4">
      <View className="w-full max-w-[420px] flex-row items-center rounded-full bg-white px-2 shadow-lg shadow-slate-300/70">
        {LEFT_ITEMS.map((item) => (
          <NavButton key={item.href} item={item} active={pathname.startsWith(item.href)} />
        ))}
        <Pressable onPress={openTransactionModal} hitSlop={6} className="flex-1 items-center justify-center">
          <View className="-mt-7 h-16 w-16 items-center justify-center rounded-full bg-cream shadow-md shadow-slate-300/70">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-primary">
              <Ionicons name="add" size={28} color="#fff" />
            </View>
          </View>
        </Pressable>
        {RIGHT_ITEMS.map((item) => (
          <NavButton key={item.href} item={item} active={pathname.startsWith(item.href)} />
        ))}
      </View>
    </View>
  );
}
