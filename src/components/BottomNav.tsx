import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTransactionModalStore } from '@/store/transactionModalStore';

/** BottomNav가 화면 아래를 가리는 높이 — Screen이 콘텐츠 하단 여백으로 그대로 가져다 쓴다. */
export const BOTTOM_NAV_CONTENT_HEIGHT = 58;

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
      className="flex-1 items-center justify-center gap-0.5 py-1.5">
      <Ionicons name={active ? item.activeIcon : item.icon} size={22} color={active ? '#02007D' : '#94a3b8'} />
      <Text className={`text-[10px] font-medium ${active ? 'text-primary' : 'text-slate-400'}`}>{item.label}</Text>
    </Pressable>
  );
}

/** 모바일 전용 하단 메뉴바 — 캘린더/통계/+(내역 추가)/자산/설정 5개 아이콘. 예산은 여기 없고
 * 설정 화면 안의 메뉴로 옮겼다. */
export function BottomNav() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const openTransactionModal = useTransactionModalStore((state) => state.open);

  return (
    <View
      style={{ height: BOTTOM_NAV_CONTENT_HEIGHT + insets.bottom, paddingBottom: insets.bottom }}
      className="absolute inset-x-0 bottom-0 flex-row items-center border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      {LEFT_ITEMS.map((item) => (
        <NavButton key={item.href} item={item} active={pathname.startsWith(item.href)} />
      ))}
      <Pressable onPress={openTransactionModal} hitSlop={6} className="flex-1 items-center justify-center">
        <View className="h-11 w-11 items-center justify-center rounded-full bg-primary">
          <Ionicons name="add" size={26} color="#fff" />
        </View>
      </Pressable>
      {RIGHT_ITEMS.map((item) => (
        <NavButton key={item.href} item={item} active={pathname.startsWith(item.href)} />
      ))}
    </View>
  );
}
