import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/apiClient';
import type { Transaction, TransactionComment, TransactionType } from '@/lib/types';

export type TransactionInput = {
  type: TransactionType;
  amount: number;
  transactionDate: string;
  categoryId: number;
  cardId: number | null;
  memo: string | null;
  note: string | null;
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
  getComments: (transactionId: number) =>
    apiClient
      .get<TransactionComment[]>(`/api/transactions/${transactionId}/comments`)
      .then((res) => res.data),
  addComment: (transactionId: number, body: string) =>
    apiClient
      .post<TransactionComment>(`/api/transactions/${transactionId}/comments`, { body })
      .then((res) => res.data),
  deleteComment: (transactionId: number, commentId: number) =>
    apiClient.delete(`/api/transactions/${transactionId}/comments/${commentId}`),
};

export function monthlyTransactionsKey(year: number, month: number) {
  return ['transactions', 'monthly', year, month];
}

export function useMonthlyTransactions(year: number, month: number, enabled = true) {
  return useQuery({
    queryKey: monthlyTransactionsKey(year, month),
    queryFn: () => transactionApi.getMonthly(year, month),
    enabled,
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

const TRANSACTION_COMMENTS_QUERY_KEY = (transactionId: number) => ['transactions', 'comments', transactionId];

export function useTransactionComments(transactionId: number) {
  return useQuery({
    queryKey: TRANSACTION_COMMENTS_QUERY_KEY(transactionId),
    queryFn: () => transactionApi.getComments(transactionId),
  });
}

export function useAddTransactionComment(transactionId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => transactionApi.addComment(transactionId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TRANSACTION_COMMENTS_QUERY_KEY(transactionId) }),
  });
}

export function useDeleteTransactionComment(transactionId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: number) => transactionApi.deleteComment(transactionId, commentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TRANSACTION_COMMENTS_QUERY_KEY(transactionId) }),
  });
}
