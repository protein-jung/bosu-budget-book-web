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
}: {
  children: ReactNode;
  scroll?: boolean;
  maxWidthClassName?: string;
  backgroundClassName?: string;
  footer?: boolean;
}) {
  const isDesktop = useIsDesktop();
  const Wrapper = scroll ? ScrollView : View;
  // 모바일에서는 화면 아래에 고정된 BottomNav가 콘텐츠를 가리니, 그만큼 여백을 더 준다.
  const bottomInset = isDesktop ? 0 : BOTTOM_NAV_CONTENT_HEIGHT;
  return (
    <SafeAreaView className={`flex-1 ${backgroundClassName}`} edges={['top', 'bottom']}>
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
