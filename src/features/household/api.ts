import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/apiClient';
import type { Household } from '@/lib/types';

const householdApi = {
  getMine: () => apiClient.get<Household>('/api/households/me').then((res) => res.data),
  create: (data: { name: string }) =>
    apiClient.post<Household>('/api/households', data).then((res) => res.data),
  join: (data: { inviteCode: string }) =>
    apiClient.post<Household>('/api/households/join', data).then((res) => res.data),
  getInviteCode: () =>
    apiClient.get<{ inviteCode: string }>('/api/households/invite-code').then((res) => res.data.inviteCode),
};

export const HOUSEHOLD_QUERY_KEY = ['household', 'me'];

export function useMyHousehold() {
  return useQuery({
    queryKey: HOUSEHOLD_QUERY_KEY,
    queryFn: householdApi.getMine,
    retry: false,
  });
}

export function useCreateHousehold() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: householdApi.create,
    onSuccess: (data) => queryClient.setQueryData(HOUSEHOLD_QUERY_KEY, data),
  });
}

export function useJoinHousehold() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: householdApi.join,
    onSuccess: (data) => queryClient.setQueryData(HOUSEHOLD_QUERY_KEY, data),
  });
}

export function useInviteCode(enabled: boolean) {
  return useQuery({
    queryKey: ['household', 'invite-code'],
    queryFn: householdApi.getInviteCode,
    enabled,
  });
}
