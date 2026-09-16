import { usePathname, useGlobalSearchParams } from 'expo-router';
import { useEffect } from 'react';

import { trackPageView } from '@/features/analytics/api';

/** 프론트의 모든 페이지 방문을 기록한다. 어드민 화면 자체는 "접속 통계"가 보려는 대상이
 * 아니므로 제외한다. RootLayout에 한 번만 마운트해서, 라우트가 바뀔 때마다(로그인 전
 * 웰컴·로그인·회원가입 포함) 조용히 기록만 하고 화면에는 아무 것도 렌더링하지 않는다.
 *
 * 인스타그램 프로필 등 외부 링크에는 `?utm_source=instagram&utm_medium=social&utm_campaign=profile`
 * 처럼 캠페인 파라미터가 붙을 수 있는데, 어느 페이지에든 붙을 수 있어서(웰컴만이 아님)
 * 화면을 그리지 않는 useGlobalSearchParams로 항상 최신 쿼리 파라미터를 읽어 같이 기록한다. */
export function PageViewTracker() {
  const pathname = usePathname();
  const { utm_source: utmSource, utm_medium: utmMedium, utm_campaign: utmCampaign } = useGlobalSearchParams<{
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
  }>();

  useEffect(() => {
    if (pathname.startsWith('/admin')) return;
    trackPageView(pathname, { utmSource, utmMedium, utmCampaign });
  }, [pathname, utmSource, utmMedium, utmCampaign]);

  return null;
}
