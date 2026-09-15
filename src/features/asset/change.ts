export type Change = { amount: number; rate: number };

export function computeChange(from: number, to: number): Change | null {
  if (from === 0) return null;
  return { amount: to - from, rate: ((to - from) / from) * 100 };
}
