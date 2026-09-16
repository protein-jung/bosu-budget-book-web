import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/apiClient';
import { adminApiClient } from '@/lib/adminApiClient';
import { getOrCreateVisitorId } from '@/lib/visitorId';

export type PageViewUtmParams = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
};

/** 페이지 방문 기록. 실패해도 화면 동작에는 영향이 없어야 하므로 에러를 그냥 삼킨다. */
export async function trackPageView(path: string, utm?: PageViewUtmParams) {
  try {
    const visitorId = await getOrCreateVisitorId();
    await apiClient.post('/api/analytics/pageview', {
      path,
      visitorId,
      utmSource: utm?.utmSource ?? null,
      utmMedium: utm?.utmMedium ?? null,
      utmCampaign: utm?.utmCampaign ?? null,
    });
  } catch {
    // 통계 수집 실패는 무시한다 — 재시도하거나 사용자에게 알릴 이유가 없다.
  }
}

export type AdminPageViewStat = {
  path: string;
  views: number;
  uniqueVisitors: number;
};

export type AdminCampaignStat = {
  utmSource: string;
  utmMedium: string | null;
  utmCampaign: string | null;
  views: number;
  uniqueVisitors: number;
};

export type AdminPageViews = {
  totalViews: number;
  totalUniqueVisitors: number;
  byPath: AdminPageViewStat[];
  byCampaign: AdminCampaignStat[];
  daily: { date: string; value: number }[];
};

export function useAdminPageViews(days = 30) {
  return useQuery({
    queryKey: ['admin', 'page-views', days],
    queryFn: () =>
      adminApiClient.get<AdminPageViews>('/api/admin/page-views', { params: { days } }).then((res) => res.data),
  });
}
