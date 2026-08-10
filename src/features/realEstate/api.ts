import { useMutation, useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/apiClient';
import type { AddressCandidate, RealEstateRegion, RealEstateTrade } from '@/lib/types';

const realEstateApi = {
  getRegions: () => apiClient.get<RealEstateRegion[]>('/api/real-estate/regions').then((res) => res.data),
  searchTrades: (params: { lawdCd: string; dealYm: string; complexName?: string }) =>
    apiClient.get<RealEstateTrade[]>('/api/real-estate/trades', { params }).then((res) => res.data),
  searchAddresses: (query: string) =>
    apiClient.get<AddressCandidate[]>('/api/real-estate/address-search', { params: { query } }).then((res) => res.data),
};

export function useRealEstateRegions() {
  return useQuery({ queryKey: ['real-estate', 'regions'], queryFn: realEstateApi.getRegions, staleTime: Infinity });
}

export function useSearchRealEstateTrades() {
  return useMutation({ mutationFn: realEstateApi.searchTrades });
}

export function useSearchAddresses() {
  return useMutation({ mutationFn: realEstateApi.searchAddresses });
}
