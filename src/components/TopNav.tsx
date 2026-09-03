import { Link, usePathname } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { NotificationBell } from '@/components/NotificationBell';
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

  return (
    <View className="bg-cream">
      <View className="border-b border-primary/10 px-8 py-7">
        <View className="mx-auto w-full max-w-[1200px] flex-row items-center justify-between">
          <Link href="/calendar" asChild>
            <Pressable>
              <View className="flex-row items-baseline gap-2">
                <Text className="font-brand text-2xl tracking-wide text-primary">BOSU</Text>
                <Text className="text-2xl font-light text-primary/55">Ledger</Text>
              </View>
              <Text className="mt-1 text-[11px] tracking-widest text-primary/40">보수가계부</Text>
              <Text className="text-[11px] tracking-widest text-primary/30">Spend less. Keep more.</Text>
            </Pressable>
          </Link>

          <View className="flex-row items-center gap-1">
            <View className="mr-3 h-8 w-px bg-primary/10" />
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.href} href={item.href} label={item.label} active={pathname.startsWith(item.href)} />
            ))}
            {isAdmin ? <NavLink href="/admin" label="관리자" active={pathname.startsWith('/admin')} /> : null}
            <View className="ml-2 h-8 w-px bg-primary/10" />
            <NotificationBell />
          </View>
        </View>
      </View>
    </View>
  );
}
