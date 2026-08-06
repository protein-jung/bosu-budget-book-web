import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/apiClient';
import type { Transaction, TransactionType } from '@/lib/types';

export type TransactionInput = {
  type: TransactionType;
  amount: number;
  transactionDate: string;
  categoryId: number;
  cardId: number | null;
  memo: string | null;
};

const transactionApi = {
  getMonthly: (year: number, month: number) =>
    apiClient
      .get<Transaction[]>('/api/transactions', { params: { year, month } })
      .then((res) => res.data),
  create: (data: TransactionInput) =>
    apiClient.post<Transaction>('/api/transactions', data).then((res) => res.data),
  update: (id: number, data: TransactionInput) =>
    apiClient.put<Transaction>(`/api/transactions/${id}`, data).then((res) => res.data),
  remove: (id: number) => apiClient.delete(`/api/transactions/${id}`),
};

export function monthlyTransactionsKey(year: number, month: number) {
  return ['transactions', 'monthly', year, month];
}

export function useMonthlyTransactions(year: number, month: number) {
  return useQuery({
    queryKey: monthlyTransactionsKey(year, month),
    queryFn: () => transactionApi.getMonthly(year, month),
  });
}

function useInvalidateTransactionQueries() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['statistics'] });
  };
}

export function useCreateTransaction() {
  const invalidate = useInvalidateTransactionQueries();
  return useMutation({
    mutationFn: transactionApi.create,
    onSuccess: invalidate,
  });
}

export function useUpdateTransaction() {
  const invalidate = useInvalidateTransactionQueries();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: TransactionInput }) => transactionApi.update(id, data),
    onSuccess: invalidate,
  });
}

export function useDeleteTransaction() {
  const invalidate = useInvalidateTransactionQueries();
  return useMutation({
    mutationFn: (id: number) => transactionApi.remove(id),
    onSuccess: invalidate,
  });
}
