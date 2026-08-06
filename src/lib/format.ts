const KRW_FORMATTER = new Intl.NumberFormat('ko-KR');

export function formatKrw(amount: number): string {
  return `${KRW_FORMATTER.format(amount)}원`;
}

export function formatSignedKrw(amount: number, type: 'INCOME' | 'EXPENSE'): string {
  const sign = type === 'INCOME' ? '+' : '-';
  return `${sign}${KRW_FORMATTER.format(amount)}원`;
}

export function formatCompactKrw(amount: number): string {
  if (amount >= 10000) {
    const man = amount / 10000;
    return `${Number.isInteger(man) ? man : man.toFixed(1)}만`;
  }
  return KRW_FORMATTER.format(amount);
}
