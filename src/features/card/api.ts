import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/apiClient';
import type { CardAccount, CardType } from '@/lib/types';

export type CardInput = { name: string; type: CardType; ownerUserId: number | null };

const cardApi = {
  getAll: () => apiClient.get<CardAccount[]>('/api/cards').then((res) => res.data),
  create: (data: CardInput) => apiClient.post<CardAccount>('/api/cards', data).then((res) => res.data),
  update: (id: number, data: CardInput) =>
    apiClient.put<CardAccount>(`/api/cards/${id}`, data).then((res) => res.data),
  remove: (id: number) => apiClient.delete(`/api/cards/${id}`),
};

export const CARD_QUERY_KEY = ['cards'];

export function useCards() {
  return useQuery({ queryKey: CARD_QUERY_KEY, queryFn: cardApi.getAll });
}

export function useCreateCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cardApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CARD_QUERY_KEY }),
  });
}

export function useUpdateCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CardInput }) => cardApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CARD_QUERY_KEY }),
  });
}

export function useDeleteCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => cardApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CARD_QUERY_KEY }),
  });
}
