import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/apiClient';
import type { Category, CategoryMemo, TransactionType } from '@/lib/types';

export type CategoryInput = {
  name: string;
  type: TransactionType;
  color: string;
  icon?: string | null;
  parentId?: number | null;
  targetAmount?: number | null;
  isGroup: boolean;
};

const categoryApi = {
  getAll: () => apiClient.get<Category[]>('/api/categories').then((res) => res.data),
  create: (data: CategoryInput) => apiClient.post<Category>('/api/categories', data).then((res) => res.data),
  update: (id: number, data: CategoryInput) =>
    apiClient.put<Category>(`/api/categories/${id}`, data).then((res) => res.data),
  remove: (id: number) => apiClient.delete(`/api/categories/${id}`),
  reorder: (categoryIds: number[]) => apiClient.put('/api/categories/reorder', { categoryIds }),
  getMemos: () => apiClient.get<CategoryMemo[]>('/api/categories/memos').then((res) => res.data),
  setMemo: (id: number, year: number, month: number, memo: string) =>
    apiClient.put(`/api/categories/${id}/memo/${year}/${month}`, { memo }),
  clearMemo: (id: number, year: number, month: number) =>
    apiClient.delete(`/api/categories/${id}/memo/${year}/${month}`),
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORY_QUERY_KEY });
      // 목표 금액이 바뀌면 통계/예산 화면의 budgets 계산도 함께 갱신돼야 한다.
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => categoryApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CATEGORY_QUERY_KEY }),
  });
}

export const CATEGORY_MEMO_QUERY_KEY = ['category-memos'];

export function useCategoryMemos() {
  return useQuery({ queryKey: CATEGORY_MEMO_QUERY_KEY, queryFn: categoryApi.getMemos });
}

export function useSetCategoryMemo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, year, month, memo }: { id: number; year: number; month: number; memo: string }) =>
      categoryApi.setMemo(id, year, month, memo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CATEGORY_MEMO_QUERY_KEY }),
  });
}

export function useClearCategoryMemo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, year, month }: { id: number; year: number; month: number }) =>
      categoryApi.clearMemo(id, year, month),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CATEGORY_MEMO_QUERY_KEY }),
  });
}

export function useReorderCategories() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (categoryIds: number[]) => categoryApi.reorder(categoryIds),
    onMutate: async (categoryIds) => {
      await queryClient.cancelQueries({ queryKey: CATEGORY_QUERY_KEY });
      const previous = queryClient.getQueryData<Category[]>(CATEGORY_QUERY_KEY);
      const orderById = new Map(categoryIds.map((id, index) => [id, index]));
      queryClient.setQueryData<Category[]>(CATEGORY_QUERY_KEY, (old) =>
        (old ?? []).map((c) => (orderById.has(c.id) ? { ...c, sortOrder: orderById.get(c.id)! } : c)),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(CATEGORY_QUERY_KEY, context.previous);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: CATEGORY_QUERY_KEY }),
  });
}
