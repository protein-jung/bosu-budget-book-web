import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/apiClient';
import { addMonths } from '@/lib/calendar';
import type { MonthlySummary, RangeSummary } from '@/lib/types';

const statisticsApi = {
  getMonthly: (year: number, month: number) =>
    apiClient
      .get<MonthlySummary>('/api/statistics/monthly', { params: { year, month } })
      .then((res) => res.data),
  getRange: (fromYear: number, fromMonth: number, toYear: number, toMonth: number) =>
    apiClient
      .get<RangeSummary>('/api/statistics/range', {
        params: { fromYear, fromMonth, toYear, toMonth },
      })
      .then((res) => res.data),
  getFullHistory: () =>
    apiClient.get<RangeSummary>('/api/statistics/full-history').then((res) => res.data),
};

export function useMonthlyStatistics(year: number, month: number) {
  return useQuery({
    queryKey: ['statistics', 'monthly', year, month],
    queryFn: () => statisticsApi.getMonthly(year, month),
  });
}

/** 선택 월 포함 직전 months 개월(기본 6개월) 추이 */
export function useRangeStatistics(year: number, month: number, months = 6) {
  const from = addMonths(year, month, -(months - 1));
  return useQuery({
    queryKey: ['statistics', 'range', from.year, from.month, year, month],
    queryFn: () => statisticsApi.getRange(from.year, from.month, year, month),
  });
}

/** 이 가계부에 처음 거래가 기록된 달부터 이번 달까지 */
export function useFullHistoryStatistics() {
  return useQuery({
    queryKey: ['statistics', 'full-history'],
    queryFn: () => statisticsApi.getFullHistory(),
  });
}
