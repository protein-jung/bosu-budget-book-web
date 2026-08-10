import type { AssetType } from './types';

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
  CASH: { label: '현금', icon: '💵', color: '#0c8599' },
  OTHER: { label: '기타', icon: '📦', color: '#495057' },
};
