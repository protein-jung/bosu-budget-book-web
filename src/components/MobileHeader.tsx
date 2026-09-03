import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import { NotificationBell } from '@/components/NotificationBell';
import { useGoHome } from '@/lib/useGoHome';
import { useAuthStore } from '@/store/authStore';

type NavItem = {
  href: '/calendar' | '/statistics' | '/budget' | '/portfolio' | '/settings' | '/admin';
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const NAV_ITEMS: NavItem[] = [
  { href: '/calendar', label: '달력', icon: 'calendar-outline' },
  { href: '/statistics', label: '통계', icon: 'stats-chart-outline' },
  { href: '/budget', label: '예산', icon: 'calculator-outline' },
  { href: '/portfolio', label: '자산', icon: 'wallet-outline' },
  { href: '/settings', label: '설정', icon: 'settings-outline' },
];

const ADMIN_NAV_ITEM: NavItem = { href: '/admin', label: '관리자', icon: 'shield-checkmark-outline' };

/** 모바일 상단 바 — 하단 탭 대신 로고 + 햄버거 메뉴로 화면을 이동한다. */
export function MobileHeader() {
  const pathname = usePathname();
  const isAdmin = useAuthStore((state) => state.user?.isAdmin ?? false);
  const [menuOpen, setMenuOpen] = useState(false);
  const goHome = useGoHome();

  const items = isAdmin ? [...NAV_ITEMS, ADMIN_NAV_ITEM] : NAV_ITEMS;

  const goTo = (href: NavItem['href']) => {
    setMenuOpen(false);
    router.push(href);
  };

  return (
    <>
      <View className="bg-cream">
        <View className="flex-row items-center justify-between border-b border-primary/10 px-4 pb-4 pt-5">
          <Pressable onPress={() => setMenuOpen(true)} hitSlop={8} className="h-10 w-10 items-center justify-center">
            <Ionicons name="menu" size={24} color="#02007D" />
          </Pressable>
          <Pressable onPress={goHome} hitSlop={8} className="items-center">
            <View className="flex-row items-baseline gap-1">
              <Text className="font-brand text-base tracking-wide text-primary">BOSU</Text>
              <Text className="text-base font-light text-primary/55">Ledger</Text>
            </View>
          </Pressable>
          <NotificationBell />
        </View>
      </View>

      <Modal visible={menuOpen} animationType="slide" transparent onRequestClose={() => setMenuOpen(false)}>
        <Pressable onPress={() => setMenuOpen(false)} className="flex-1 justify-end bg-black/40">
          <Pressable onPress={(e) => e.stopPropagation()} className="gap-1 rounded-t-3xl bg-white p-3 pb-8">
            <View className="items-center pb-2 pt-1">
              <View className="h-1 w-10 rounded-full bg-slate-200" />
            </View>
            {items.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Pressable
                  key={item.href}
                  onPress={() => goTo(item.href)}
                  className={`flex-row items-center gap-3 rounded-xl px-4 py-3.5 ${active ? 'bg-primary-light' : ''}`}>
                  <Ionicons name={item.icon} size={20} color={active ? '#02007D' : '#64748b'} />
                  <Text className={`text-base font-medium ${active ? 'text-primary' : 'text-slate-700'}`}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
