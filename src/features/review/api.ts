import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/apiClient';
import type { Review } from '@/lib/types';

export type ReviewInput = {
  rating: number;
  content: string | null;
};

const reviewApi = {
  getMine: () => apiClient.get<Review[]>('/api/reviews').then((res) => res.data),
  create: (data: ReviewInput) => apiClient.post<Review>('/api/reviews', data).then((res) => res.data),
};

export const REVIEW_QUERY_KEY = ['reviews'];

export function useMyReviews() {
  return useQuery({ queryKey: REVIEW_QUERY_KEY, queryFn: reviewApi.getMine });
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reviewApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: REVIEW_QUERY_KEY }),
  });
}
