import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/apiClient';
import type {
  AccountCategory,
  Asset,
  AssetRefreshResult,
  AssetSnapshot,
  AssetSummary,
  AssetType,
  CashCategory,
  LoanRepaymentType,
  PriceCurrency,
  RealEstateCategory,
  StockSymbolCandidate,
} from '@/lib/types';

export type AssetInput = {
  type: AssetType;
  name: string;
  custodian: string | null;
  symbol: string | null;
  quantity: number | null;
  averagePrice: number | null;
  averagePriceCurrency: PriceCurrency | null;
  manualValue: number | null;
  memo: string | null;
  address: string | null;
  dong: string | null;
  ho: string | null;
  lawdCd: string | null;
  complexName: string | null;
  regionDongName: string | null;
  accountCategory: AccountCategory | null;
  cashCategory: CashCategory | null;
  maturityDate: string | null;
  cashInterestRate: number | null;
  cashStartDate: string | null;
  purchaseDate: string | null;
  encarUrl: string | null;
  loanPrincipal: number | null;
  loanStartMonth: string | null;
  loanTermMonths: number | null;
  loanMonthlyPayment: number | null;
  loanInterestRate: number | null;
  loanRepaymentType: LoanRepaymentType | null;
  realEstateCategory: RealEstateCategory | null;
  monthlyRent: number | null;
};

const assetApi = {
  getAll: () => apiClient.get<Asset[]>('/api/assets').then((res) => res.data),
  getSummary: () => apiClient.get<AssetSummary>('/api/assets/summary').then((res) => res.data),
  getSnapshots: (days: number) =>
    apiClient.get<AssetSnapshot[]>('/api/assets/snapshots', { params: { days } }).then((res) => res.data),
  create: (data: AssetInput) => apiClient.post<Asset>('/api/assets', data).then((res) => res.data),
  update: (id: number, data: AssetInput) => apiClient.put<Asset>(`/api/assets/${id}`, data).then((res) => res.data),
  remove: (id: number) => apiClient.delete(`/api/assets/${id}`),
  refreshPrices: () => apiClient.post<AssetRefreshResult>('/api/assets/refresh-prices').then((res) => res.data),
  searchSymbols: (query: string) =>
    apiClient.get<StockSymbolCandidate[]>('/api/assets/search-symbols', { params: { query } }).then((res) => res.data),
};

export const ASSET_QUERY_KEY = ['assets'];
export const ASSET_SUMMARY_QUERY_KEY = ['assets', 'summary'];

function useInvalidateAssetQueries() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ASSET_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: ASSET_SUMMARY_QUERY_KEY });
  };
}

export function useAssets() {
  return useQuery({ queryKey: ASSET_QUERY_KEY, queryFn: assetApi.getAll });
}

export function useAssetSummary() {
  return useQuery({ queryKey: ASSET_SUMMARY_QUERY_KEY, queryFn: assetApi.getSummary });
}

export function useAssetTrend(days = 90) {
  return useQuery({
    queryKey: ['assets', 'snapshots', days],
    queryFn: () => assetApi.getSnapshots(days),
  });
}

export function useCreateAsset() {
  const invalidate = useInvalidateAssetQueries();
  return useMutation({ mutationFn: assetApi.create, onSuccess: invalidate });
}

export function useUpdateAsset() {
  const invalidate = useInvalidateAssetQueries();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: AssetInput }) => assetApi.update(id, data),
    onSuccess: invalidate,
  });
}

export function useDeleteAsset() {
  const invalidate = useInvalidateAssetQueries();
  return useMutation({ mutationFn: (id: number) => assetApi.remove(id), onSuccess: invalidate });
}

export function useRefreshAssetPrices() {
  const invalidate = useInvalidateAssetQueries();
  return useMutation({ mutationFn: assetApi.refreshPrices, onSuccess: invalidate });
}

export function useSearchStockSymbols() {
  return useMutation({ mutationFn: assetApi.searchSymbols });
}
