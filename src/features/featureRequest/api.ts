import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/apiClient';
import type { FeatureRequest } from '@/lib/types';

export type FeatureRequestInput = {
  title: string;
  content: string;
};

const featureRequestApi = {
  getAll: () => apiClient.get<FeatureRequest[]>('/api/feature-requests').then((res) => res.data),
  create: (data: FeatureRequestInput) =>
    apiClient.post<FeatureRequest>('/api/feature-requests', data).then((res) => res.data),
};

export const FEATURE_REQUEST_QUERY_KEY = ['feature-requests'];

export function useFeatureRequests() {
  return useQuery({ queryKey: FEATURE_REQUEST_QUERY_KEY, queryFn: featureRequestApi.getAll });
}

export function useCreateFeatureRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: featureRequestApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: FEATURE_REQUEST_QUERY_KEY }),
  });
}
