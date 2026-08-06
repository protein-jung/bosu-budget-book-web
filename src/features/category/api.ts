import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/apiClient';
import type { Category, TransactionType } from '@/lib/types';

export type CategoryInput = { name: string; type: TransactionType; color: string };

const categoryApi = {
  getAll: () => apiClient.get<Category[]>('/api/categories').then((res) => res.data),
  create: (data: CategoryInput) => apiClient.post<Category>('/api/categories', data).then((res) => res.data),
  update: (id: number, data: CategoryInput) =>
    apiClient.put<Category>(`/api/categories/${id}`, data).then((res) => res.data),
  remove: (id: number) => apiClient.delete(`/api/categories/${id}`),
};

export const CATEGORY_QUERY_KEY = ['categories'];

export function useCategories() {
  return useQuery({ queryKey: CATEGORY_QUERY_KEY, queryFn: categoryApi.getAll });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: categoryApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CATEGORY_QUERY_KEY }),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CategoryInput }) => categoryApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CATEGORY_QUERY_KEY }),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => categoryApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CATEGORY_QUERY_KEY }),
  });
}
