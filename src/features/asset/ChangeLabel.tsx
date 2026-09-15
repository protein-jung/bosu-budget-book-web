import { Text } from 'react-native';

import type { Change } from '@/features/asset/change';

export function ChangeLabel({ change, caption }: { change: Change | null; caption: string }) {
  if (!change) {
    return <Text className="text-xs text-slate-400">데이터가 더 쌓이면 표시돼요</Text>;
  }
  if (change.rate === 0) {
    return (
      <Text className="text-xs font-semibold text-slate-400">
        변동 없음 <Text className="text-xs font-normal text-slate-400">{caption}</Text>
      </Text>
    );
  }
  const positive = change.rate > 0;
  return (
    <Text className={`text-xs font-semibold ${positive ? 'text-emerald-600' : 'text-red-500'}`}>
      {positive ? '▲' : '▼'} {positive ? '+' : ''}
      {change.rate.toFixed(2)}%{' '}
      <Text className="text-xs font-normal text-slate-400">{caption}</Text>
    </Text>
  );
}
