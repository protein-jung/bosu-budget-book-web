import { Pressable, Text, View } from 'react-native';

import { NotificationBell } from '@/components/NotificationBell';
import { useGoHome } from '@/lib/useGoHome';

/** 모바일 상단 바 — 로고와 알림뿐이다. 화면 이동은 하단 메뉴바(BottomNav)가 맡는다. */
export function MobileHeader() {
  const goHome = useGoHome();

  return (
    <View className="bg-cream">
      <View className="flex-row items-center justify-between border-b border-primary/10 px-4 pb-4 pt-5">
        <View className="h-10 w-10" />
        <Pressable onPress={goHome} hitSlop={8} className="items-center">
          <View className="flex-row items-baseline gap-1">
            <Text className="font-brand text-base tracking-wide text-primary">BOSU</Text>
            <Text className="text-base font-light text-primary/55">Ledger</Text>
          </View>
        </Pressable>
        <NotificationBell />
      </View>
    </View>
  );
}
