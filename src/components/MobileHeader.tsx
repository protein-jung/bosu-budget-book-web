import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NotificationBell } from '@/components/NotificationBell';

/** 모바일 헤더 영역 자체를 없앴다 — 레이아웃 공간을 차지하지 않도록 화면 위에 절대 위치로
 * 떠 있는 알림 벨만 남긴다. 화면 이동은 하단 메뉴바(BottomNav)가 맡는다. pointerEvents가
 * box-none이라 벨 버튼 바깥은 터치가 그대로 아래 콘텐츠로 전달된다. */
export function MobileHeader() {
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
      <SafeAreaView edges={['top']}>
        <View pointerEvents="box-none" className="flex-row justify-end px-3 pt-1">
          <NotificationBell />
        </View>
      </SafeAreaView>
    </View>
  );
}
