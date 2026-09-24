import { Redirect, router, Tabs, usePathname } from 'expo-router';
import { useRef } from 'react';
import { ActivityIndicator, PanResponder, View } from 'react-native';

import { BottomNav } from '@/components/BottomNav';
import { MobileHeader } from '@/components/MobileHeader';
import { TopNav } from '@/components/TopNav';
import { TransactionFormModal } from '@/features/transaction/TransactionFormModal';
import { useMyHousehold } from '@/features/household/api';
import { HouseholdOnboarding } from '@/features/household/HouseholdOnboarding';
import { useIsDesktop } from '@/lib/responsive';
import { useAuthStore } from '@/store/authStore';
import { useTransactionModalStore } from '@/store/transactionModalStore';

/** BottomNav 아이콘과 같은 순서 — 모바일에서 좌우로 스와이핑하면 이 순서대로 탭이 바뀐다.
 * 예산 탭은 BottomNav에도 없어서(설정 안으로 옮겨짐) 스와이프 대상에서도 제외한다. */
const SWIPE_TAB_ORDER = ['/calendar', '/statistics', '/portfolio', '/settings'] as const;
const SWIPE_THRESHOLD = 60;

/** 탭 화면 4개를 좌우로 스와이핑해 넘나들 수 있게 하는 PanResponder. gestureState의 dx는
 * react-native-web에서 마우스 드래그 시 신뢰할 수 없어서(DraggableList와 동일한 이유),
 * 시작/종료 시점의 raw pageX 차이로 직접 계산한다. 세로 스크롤·탭과 헷갈리지 않도록 가로
 * 이동이 세로 이동보다 뚜렷하게 클 때만 제스처를 가로챈다. */
function useTabSwipeHandlers(enabled: boolean, pathname: string) {
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const tabIndexRef = useRef(-1);
  tabIndexRef.current = SWIPE_TAB_ORDER.indexOf(pathname as (typeof SWIPE_TAB_ORDER)[number]);
  const startXRef = useRef<number | null>(null);

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_evt, gestureState) =>
        enabledRef.current &&
        tabIndexRef.current !== -1 &&
        Math.abs(gestureState.dx) > 20 &&
        Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 2,
      onPanResponderGrant: (evt) => {
        startXRef.current = evt.nativeEvent.pageX;
      },
      onPanResponderRelease: (evt) => {
        const startX = startXRef.current;
        startXRef.current = null;
        const index = tabIndexRef.current;
        if (startX == null || index === -1) return;
        const deltaX = evt.nativeEvent.pageX - startX;
        if (deltaX <= -SWIPE_THRESHOLD && index < SWIPE_TAB_ORDER.length - 1) {
          router.push(SWIPE_TAB_ORDER[index + 1]);
        } else if (deltaX >= SWIPE_THRESHOLD && index > 0) {
          router.push(SWIPE_TAB_ORDER[index - 1]);
        }
      },
      onPanResponderTerminate: () => {
        startXRef.current = null;
      },
    }),
  );

  return responder.current.panHandlers;
}

export default function MainLayout() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAdmin = useAuthStore((state) => state.user?.isAdmin ?? false);
  const householdQuery = useMyHousehold();
  const isDesktop = useIsDesktop();
  const pathname = usePathname();
  const transactionModalVisible = useTransactionModalStore((state) => state.visible);
  const transactionModalDateKey = useTransactionModalStore((state) => state.dateKey);
  const closeTransactionModal = useTransactionModalStore((state) => state.close);
  const swipeHandlers = useTabSwipeHandlers(!isDesktop, pathname);

  if (!accessToken) {
    return <Redirect href="/login" />;
  }

  if (householdQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-cream">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!householdQuery.data) {
    return <HouseholdOnboarding />;
  }

  return (
    <View className="flex-1">
      {isDesktop ? <TopNav /> : <MobileHeader />}
      <View className="flex-1" {...swipeHandlers}>
        <Tabs screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}>
          <Tabs.Screen name="calendar" options={{ title: '달력' }} />
          <Tabs.Screen name="statistics" options={{ title: '통계' }} />
          <Tabs.Screen name="budget" options={{ title: '예산' }} />
          <Tabs.Screen name="portfolio" options={{ title: '자산' }} />
          <Tabs.Screen name="settings" options={{ title: '설정' }} />
          {isAdmin ? <Tabs.Screen name="admin" options={{ title: '관리자' }} /> : null}
        </Tabs>
      </View>
      {!isDesktop ? <BottomNav /> : null}

      <TransactionFormModal
        visible={transactionModalVisible}
        onClose={closeTransactionModal}
        dateKey={transactionModalDateKey}
      />
    </View>
  );
}
