import { View } from 'react-native';

import { NotificationBell } from '@/components/NotificationBell';

/** 모바일 상단 바를 없앴다 — 로고, 구분선, 배경 없이 알림 벨만 오른쪽 위에 남긴다. 화면 이동은
 * 하단 메뉴바(BottomNav)가 맡는다. 화면 배경(bg-cream)과 같은 색이라 시각적으로는 헤더가
 * 없는 것처럼 보이지만, 알림 벨이 놓일 자리만큼은 공간을 차지해서 각 화면 콘텐츠 맨 위 줄과
 * 겹치지 않게 한다. */
export function MobileHeader() {
  return (
    <View className="flex-row justify-end bg-cream px-4 pt-5">
      <NotificationBell />
    </View>
  );
}
