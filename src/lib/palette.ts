import type { AssetType, CashCategory, LoanRepaymentType, RealEstateCategory } from './types';

export const CATEGORY_COLOR_PALETTE = [
  '#e03131',
  '#f08c00',
  '#2f9e44',
  '#1971c2',
  '#7048e8',
  '#e64980',
  '#495057',
  '#0c8599',
];

export const CATEGORY_ICON_PALETTE = [
  '🏠',
  '🚗',
  '🍽️',
  '🛒',
  '📱',
  '💊',
  '🏥',
  '🛡️',
  '💰',
  '🏦',
  '📈',
  '🎁',
  '💳',
  '⛽',
  '🚌',
  '👶',
  '✂️',
  '🎬',
  '🐾',
  '🧾',
  '📦',
  '💵',
  '🤝',
  '❓',
];

export const ASSET_TYPE_META: Record<AssetType, { label: string; icon: string; color: string }> = {
  REAL_ESTATE: { label: '부동산', icon: '🏠', color: '#1971c2' },
  VEHICLE: { label: '차량', icon: '🚗', color: '#f08c00' },
  STOCK: { label: '주식', icon: '📈', color: '#2f9e44' },
  CRYPTO: { label: '코인', icon: '🪙', color: '#7048e8' },
  GOLD: { label: '금', icon: '🥇', color: '#f59f00' },
  SILVER: { label: '은', icon: '🥈', color: '#868e96' },
  CASH: { label: '현금', icon: '💵', color: '#0c8599' },
  LOAN: { label: '대출', icon: '🏦', color: '#e03131' },
  OTHER: { label: '기타', icon: '📦', color: '#495057' },
};

export const CASH_CATEGORY_META: Record<CashCategory, { label: string }> = {
  ACCOUNT: { label: '계좌' },
  DEPOSIT: { label: '예금' },
  SAVINGS: { label: '적금' },
};

export const LOAN_REPAYMENT_TYPE_META: Record<LoanRepaymentType, { label: string; shortLabel: string }> = {
  EQUAL_INSTALLMENT: { label: '원리금균등분할상환', shortLabel: '원리금균등' },
  EQUAL_PRINCIPAL: { label: '원금균등분할상환', shortLabel: '원금균등' },
};

export const REAL_ESTATE_CATEGORY_META: Record<RealEstateCategory, { label: string; valueLabel: string }> = {
  OWNED: { label: '자가', valueLabel: '평가금액' },
  JEONSE: { label: '전세', valueLabel: '전세보증금' },
  WOLSE: { label: '월세', valueLabel: '보증금' },
};
