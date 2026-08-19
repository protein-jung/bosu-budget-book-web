import { Link, usePathname } from 'expo-router';
import { Image, Pressable, Text, View } from 'react-native';

const NAV_ITEMS: { href: '/calendar' | '/statistics' | '/budget' | '/portfolio' | '/settings'; label: string }[] = [
  { href: '/calendar', label: '달력' },
  { href: '/statistics', label: '통계' },
  { href: '/budget', label: '예산' },
  { href: '/portfolio', label: '자산' },
  { href: '/settings', label: '설정' },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <View className="border-b border-primary-light bg-cream px-8 pb-4 pt-8">
      <View className="mx-auto w-full max-w-[1200px] flex-row items-center justify-between">
        <Link href="/calendar" asChild>
          <Pressable className="flex-row items-center gap-2.5">
            {/* eslint-disable-next-line @typescript-eslint/no-require-imports */}
            <Image
              source={require('../../assets/images/splash-icon.png')}
              style={{ width: 32, height: 32 }}
              resizeMode="contain"
            />
            <Text className="text-lg font-bold text-primary">보수가계부</Text>
          </Pressable>
        </Link>

        <View className="flex-row gap-2">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} asChild>
                <Pressable className={`rounded-full px-4 py-2 ${active ? 'bg-primary' : ''}`}>
                  <Text className={`font-medium ${active ? 'text-white' : 'text-slate-600'}`}>{item.label}</Text>
                </Pressable>
              </Link>
            );
          })}
        </View>
      </View>
    </View>
  );
}
