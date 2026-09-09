import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/apiClient';
import { addMonths } from '@/lib/calendar';
import type { MonthComment, MonthlySummary, RangeSummary } from '@/lib/types';

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
  getMonthComments: (year: number, month: number) =>
    apiClient
      .get<MonthComment[]>('/api/statistics/month-comments', { params: { year, month } })
      .then((res) => res.data),
  addMonthComment: (data: { year: number; month: number; body: string }) =>
    apiClient.post<MonthComment>('/api/statistics/month-comments', data).then((res) => res.data),
  deleteMonthComment: (id: number) => apiClient.delete(`/api/statistics/month-comments/${id}`),
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

const MONTH_COMMENTS_QUERY_KEY = (year: number, month: number) => ['statistics', 'month-comments', year, month];

export function useMonthComments(year: number, month: number) {
  return useQuery({
    queryKey: MONTH_COMMENTS_QUERY_KEY(year, month),
    queryFn: () => statisticsApi.getMonthComments(year, month),
  });
}

export function useAddMonthComment(year: number, month: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => statisticsApi.addMonthComment({ year, month, body }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MONTH_COMMENTS_QUERY_KEY(year, month) }),
  });
}

export function useDeleteMonthComment(year: number, month: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => statisticsApi.deleteMonthComment(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MONTH_COMMENTS_QUERY_KEY(year, month) }),
  });
}
