import { usePathname } from 'expo-router';
import { useEffect } from 'react';

import { trackPageView } from '@/features/analytics/api';

/** 프론트의 모든 페이지 방문을 기록한다. 어드민 화면 자체는 "접속 통계"가 보려는 대상이
 * 아니므로 제외한다. RootLayout에 한 번만 마운트해서, 라우트가 바뀔 때마다(로그인 전
 * 웰컴·로그인·회원가입 포함) 조용히 기록만 하고 화면에는 아무 것도 렌더링하지 않는다. */
export function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith('/admin')) return;
    trackPageView(pathname);
  }, [pathname]);

  return null;
}
