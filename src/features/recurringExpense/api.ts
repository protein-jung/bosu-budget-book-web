import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/apiClient';
import type { RecurringExpense } from '@/lib/types';

export type RecurringExpenseInput = {
  categoryId: number;
  name: string;
  amount: number;
  dayOfMonth: number;
  active: boolean;
  memo: string | null;
};

const recurringExpenseApi = {
  getAll: () => apiClient.get<RecurringExpense[]>('/api/recurring-expenses').then((res) => res.data),
  create: (data: RecurringExpenseInput) =>
    apiClient.post<RecurringExpense>('/api/recurring-expenses', data).then((res) => res.data),
  update: (id: number, data: RecurringExpenseInput) =>
    apiClient.put<RecurringExpense>(`/api/recurring-expenses/${id}`, data).then((res) => res.data),
  setActive: (id: number, active: boolean) =>
    apiClient.patch<RecurringExpense>(`/api/recurring-expenses/${id}/active`, { active }).then((res) => res.data),
  remove: (id: number) => apiClient.delete(`/api/recurring-expenses/${id}`),
};

export const RECURRING_EXPENSE_QUERY_KEY = ['recurring-expenses'];

export function useRecurringExpenses() {
  return useQuery({ queryKey: RECURRING_EXPENSE_QUERY_KEY, queryFn: recurringExpenseApi.getAll });
}

export function useCreateRecurringExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: recurringExpenseApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: RECURRING_EXPENSE_QUERY_KEY }),
  });
}

export function useUpdateRecurringExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: RecurringExpenseInput }) => recurringExpenseApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: RECURRING_EXPENSE_QUERY_KEY }),
  });
}

export function useSetRecurringExpenseActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) => recurringExpenseApi.setActive(id, active),
    onMutate: async ({ id, active }) => {
      await queryClient.cancelQueries({ queryKey: RECURRING_EXPENSE_QUERY_KEY });
      const previous = queryClient.getQueryData<RecurringExpense[]>(RECURRING_EXPENSE_QUERY_KEY);
      queryClient.setQueryData<RecurringExpense[]>(RECURRING_EXPENSE_QUERY_KEY, (current) =>
        current?.map((item) => (item.id === id ? { ...item, active } : item)),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(RECURRING_EXPENSE_QUERY_KEY, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: RECURRING_EXPENSE_QUERY_KEY }),
  });
}

export function useDeleteRecurringExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => recurringExpenseApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: RECURRING_EXPENSE_QUERY_KEY }),
  });
}
