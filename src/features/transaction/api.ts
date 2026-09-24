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
  search: (q: string, from: string | null, to: string | null) =>
    apiClient
      .get<Transaction[]>('/api/transactions/search', {
        params: { q: q || undefined, from: from ?? undefined, to: to ?? undefined },
      })
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

/** 제목/메모/카테고리명(query), 날짜 범위(from~to) 조건으로 내역을 찾는 검색창에서 쓴다. 셋 다
 * 비어있으면 요청을 보내지 않는다 — 디바운스는 호출하는 쪽(SearchModal)에서 검색어 자체를
 * 늦게 넘겨서 한다. */
export function useSearchTransactions(query: string, fromDate: string | null, toDate: string | null) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: ['transactions', 'search', trimmed, fromDate, toDate],
    queryFn: () => transactionApi.search(trimmed, fromDate, toDate),
    enabled: trimmed.length > 0 || fromDate != null || toDate != null,
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
