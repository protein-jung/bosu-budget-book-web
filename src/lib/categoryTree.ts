import type { Category, TransactionType } from '@/lib/types';

/** 최상위 카테고리(대분류) 목록. 하위가 하나도 없는 빈 그룹(isGroup인데 소분류를 아직 안 만든
 * 경우)은 골라도 아무것도 못 고르는 막다른 길이라 제외한다. */
export function topLevelCategories(categories: Category[], type: TransactionType): Category[] {
  return categories.filter(
    (c) => c.type === type && c.parentId == null && (!c.isGroup || categories.some((child) => child.parentId === c.id)),
  );
}

export function childCategories(categories: Category[], type: TransactionType, parentId: number): Category[] {
  return categories.filter((c) => c.type === type && c.parentId === parentId);
}
