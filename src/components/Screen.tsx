import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BOTTOM_NAV_CONTENT_HEIGHT } from '@/components/BottomNav';
import { Footer } from '@/components/Footer';
import { useIsDesktop } from '@/lib/responsive';

export function Screen({
  children,
  scroll = true,
  maxWidthClassName = 'max-w-[480px]',
  backgroundClassName = 'bg-cream',
  footer = false,
  topInset = false,
}: {
  children: ReactNode;
  scroll?: boolean;
  maxWidthClassName?: string;
  backgroundClassName?: string;
  footer?: boolean;
  /** (main) 탭 화면들은 위에 MobileHeader/TopNav가 이미 안전 영역을 챙겨주니 기본은 false.
   * 헤더 없이 화면 맨 위부터 시작하는 화면(로그인 등)에서만 true로 켠다. */
  topInset?: boolean;
}) {
  const isDesktop = useIsDesktop();
  const Wrapper = scroll ? ScrollView : View;
  // 모바일에서는 화면 아래에 고정된 BottomNav가 콘텐츠를 가리니, 그만큼 여백을 더 준다.
  const bottomInset = isDesktop ? 0 : BOTTOM_NAV_CONTENT_HEIGHT;
  return (
    <SafeAreaView
      className={`flex-1 ${backgroundClassName}`}
      edges={topInset ? ['top', 'bottom'] : ['bottom']}>
      <Wrapper
        className={`mx-auto w-full ${maxWidthClassName} flex-1`}
        contentContainerClassName={scroll ? 'gap-4 p-5' : undefined}
        contentContainerStyle={scroll ? { paddingBottom: 20 + bottomInset } : undefined}
        style={scroll ? undefined : { flex: 1, padding: 20, paddingBottom: 20 + bottomInset, gap: 16 }}>
        {children}
        {footer ? <Footer /> : null}
      </Wrapper>
    </SafeAreaView>
  );
}
