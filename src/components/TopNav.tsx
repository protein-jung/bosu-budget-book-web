import { Ionicons } from '@expo/vector-icons';
import { Link, usePathname } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';

import { NotificationBell } from '@/components/NotificationBell';
import { TransactionSearchModal } from '@/features/transaction/TransactionSearchModal';
import { useAuthStore } from '@/store/authStore';

const NAV_ITEMS: { href: '/calendar' | '/statistics' | '/budget' | '/portfolio' | '/settings'; label: string }[] = [
  { href: '/calendar', label: '달력' },
  { href: '/statistics', label: '통계' },
  { href: '/budget', label: '예산' },
  { href: '/portfolio', label: '자산' },
  { href: '/settings', label: '설정' },
];

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link href={href as never} asChild>
      <Pressable className="items-center px-3.5 py-2">
        <Text
          className={`text-sm tracking-wide ${active ? 'font-semibold text-primary' : 'font-normal text-primary/40'}`}>
          {label}
        </Text>
        <View className={`mt-2 h-[3px] w-3.5 rounded-full ${active ? 'bg-secondary' : 'bg-transparent'}`} />
      </Pressable>
    </Link>
  );
}

export function TopNav() {
  const pathname = usePathname();
  const isAdmin = useAuthStore((state) => state.user?.isAdmin ?? false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <View className="bg-cream">
      <View className="border-b border-primary/10 px-8 py-7">
        <View className="mx-auto w-full max-w-[1200px] flex-row items-center justify-between">
          <Link href="/calendar" asChild>
            <Pressable>
              <Image
                source={require('../../assets/marketing/brand-tagline.png')}
                accessibilityLabel="BOSU Ledger — Spend less, Keep more"
                resizeMode="contain"
                style={{ width: 150, height: 150 * (803 / 1442) }}
              />
            </Pressable>
          </Link>

          <View className="flex-row items-center gap-1">
            <View className="mr-3 h-8 w-px bg-primary/10" />
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.href} href={item.href} label={item.label} active={pathname.startsWith(item.href)} />
            ))}
            {isAdmin ? <NavLink href="/admin" label="관리자" active={pathname.startsWith('/admin')} /> : null}
            <View className="ml-2 h-8 w-px bg-primary/10" />
            <Pressable
              onPress={() => setSearchOpen(true)}
              hitSlop={8}
              className="h-10 w-10 items-center justify-center">
              <Ionicons name="search-outline" size={20} color="#02007D" />
            </Pressable>
            <NotificationBell />
          </View>
        </View>
      </View>

      <TransactionSearchModal visible={searchOpen} onClose={() => setSearchOpen(false)} />
    </View>
  );
}
