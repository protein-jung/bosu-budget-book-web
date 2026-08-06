import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/apiClient';
import type { MonthlySummary } from '@/lib/types';

const statisticsApi = {
  getMonthly: (year: number, month: number) =>
    apiClient
      .get<MonthlySummary>('/api/statistics/monthly', { params: { year, month } })
      .then((res) => res.data),
};

export function useMonthlyStatistics(year: number, month: number) {
  return useQuery({
    queryKey: ['statistics', 'monthly', year, month],
    queryFn: () => statisticsApi.getMonthly(year, month),
  });
}
