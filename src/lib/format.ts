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

/** 숫자만 있는 입력값(예: "45000")을 입력창에 보여줄 콤마 형식("45,000")으로 바꾼다. */
export function formatAmountInput(digits: string): string {
  if (!digits) return '';
  return KRW_FORMATTER.format(Number(digits));
}
