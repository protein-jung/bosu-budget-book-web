import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NotificationBell } from '@/components/NotificationBell';
import { TransactionSearchModal } from '@/features/transaction/TransactionSearchModal';
import { useGoHome } from '@/lib/useGoHome';

const TAGLINE_ASPECT_RATIO = 619 / 1295;

/** 모바일 상단 바 — 왼쪽 검색, 가운데 슬로건 로고, 오른쪽 알림 벨. 화면 이동은 하단 메뉴바
 * (BottomNav)가 맡는다. 네이티브에서는 상태바/노치 아래로 내려오도록 안전 영역을 직접
 * 챙겨준다 — 웹에는 노치가 없어서 top이 0으로 잡혀 영향이 없다. */
export function MobileHeader() {
  const goHome = useGoHome();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <SafeAreaView edges={['top']} className="bg-cream">
        <View className="flex-row items-center justify-between border-b border-primary/10 bg-cream px-4 py-2.5">
          <Pressable
            onPress={() => setSearchOpen(true)}
            hitSlop={8}
            className="h-10 w-10 items-center justify-center">
            <Ionicons name="search-outline" size={22} color="#105753" />
          </Pressable>
          <Pressable onPress={goHome} hitSlop={8}>
            <Image
              source={require('../../assets/marketing/brand-tagline.png')}
              accessibilityLabel="BOSU Ledger — Spend less, Keep more"
              resizeMode="contain"
              style={{ width: 96, height: 96 * TAGLINE_ASPECT_RATIO }}
            />
          </Pressable>
          <NotificationBell />
        </View>
      </SafeAreaView>

      <TransactionSearchModal visible={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
