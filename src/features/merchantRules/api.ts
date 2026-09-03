import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/apiClient';
import type { MerchantCategoryRule, UncategorizedMerchant } from '@/lib/types';

export type MerchantCategoryRuleInput = {
  categoryId: number;
  keywords: string[];
};

const merchantRuleApi = {
  getAll: () =>
    apiClient.get<MerchantCategoryRule[]>('/api/merchant-category-rules').then((res) => res.data),
  getUncategorizedMerchants: () =>
    apiClient
      .get<UncategorizedMerchant[]>('/api/merchant-category-rules/uncategorized-merchants')
      .then((res) => res.data),
  create: (data: MerchantCategoryRuleInput) =>
    apiClient.post<MerchantCategoryRule>('/api/merchant-category-rules', data).then((res) => res.data),
  update: (id: number, data: MerchantCategoryRuleInput) =>
    apiClient.put<MerchantCategoryRule>(`/api/merchant-category-rules/${id}`, data).then((res) => res.data),
  remove: (id: number) => apiClient.delete(`/api/merchant-category-rules/${id}`),
};

export const MERCHANT_CATEGORY_RULE_QUERY_KEY = ['merchant-category-rules'];
export const UNCATEGORIZED_MERCHANTS_QUERY_KEY = ['uncategorized-merchants'];

export function useMerchantCategoryRules() {
  return useQuery({ queryKey: MERCHANT_CATEGORY_RULE_QUERY_KEY, queryFn: merchantRuleApi.getAll });
}

export function useUncategorizedMerchants() {
  return useQuery({ queryKey: UNCATEGORIZED_MERCHANTS_QUERY_KEY, queryFn: merchantRuleApi.getUncategorizedMerchants });
}

export function useCreateMerchantRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: merchantRuleApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MERCHANT_CATEGORY_RULE_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: UNCATEGORIZED_MERCHANTS_QUERY_KEY });
    },
  });
}

export function useUpdateMerchantRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: MerchantCategoryRuleInput }) => merchantRuleApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MERCHANT_CATEGORY_RULE_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: UNCATEGORIZED_MERCHANTS_QUERY_KEY });
    },
  });
}

export function useDeleteMerchantRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => merchantRuleApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MERCHANT_CATEGORY_RULE_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: UNCATEGORIZED_MERCHANTS_QUERY_KEY });
    },
  });
}
