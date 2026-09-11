import { Pressable, Text, View } from 'react-native';

import { NotificationBell } from '@/components/NotificationBell';
import { useGoHome } from '@/lib/useGoHome';

/** 모바일 상단 바 — 왼쪽 로고, 오른쪽 알림 벨. 화면 이동은 하단 메뉴바(BottomNav)가 맡는다. */
export function MobileHeader() {
  const goHome = useGoHome();

  return (
    <View className="flex-row items-center justify-between border-b border-primary/10 bg-cream px-4 pb-4 pt-5">
      <Pressable onPress={goHome} hitSlop={8}>
        <View className="flex-row items-baseline gap-1">
          <Text className="font-brand text-base tracking-wide text-primary">BOSU</Text>
          <Text className="text-base font-light text-primary/55">Ledger</Text>
        </View>
      </Pressable>
      <NotificationBell />
    </View>
  );
}
