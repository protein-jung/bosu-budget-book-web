import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';

import { NotificationBell } from '@/components/NotificationBell';
import { TransactionSearchModal } from '@/features/transaction/TransactionSearchModal';
import { useGoHome } from '@/lib/useGoHome';

const TAGLINE_ASPECT_RATIO = 803 / 1442;

/** 모바일 상단 바 — 왼쪽 검색, 가운데 로고, 오른쪽 알림 벨. 로고 아래에 작은 슬로건 이미지를
 * 덧붙인다. 화면 이동은 하단 메뉴바(BottomNav)가 맡는다. */
export function MobileHeader() {
  const goHome = useGoHome();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <View className="border-b border-primary/10 bg-cream">
        <View className="flex-row items-center justify-between px-4 py-2.5">
          <Pressable
            onPress={() => setSearchOpen(true)}
            hitSlop={8}
            className="h-10 w-10 items-center justify-center">
            <Ionicons name="search-outline" size={22} color="#02007D" />
          </Pressable>
          <Pressable onPress={goHome} hitSlop={8} className="items-center">
            <View className="flex-row items-baseline gap-1">
              <Text className="font-brand text-base tracking-wide text-primary">BOSU</Text>
              <Text className="text-base font-light text-primary/55">Ledger</Text>
              <Text className="text-[10px] tracking-wide text-primary/40">· 보수가계부</Text>
            </View>
          </Pressable>
          <NotificationBell />
        </View>
        <Pressable onPress={goHome} hitSlop={4} className="items-center pb-2">
          <Image
            source={require('../../assets/marketing/brand-tagline.png')}
            accessibilityLabel="Spend less, Keep more"
            resizeMode="contain"
            style={{ width: 96, height: 96 * TAGLINE_ASPECT_RATIO }}
          />
        </Pressable>
      </View>

      <TransactionSearchModal visible={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
