import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

/** 블로그 글 본문에서 쓰는 최소한의 타이포그래피 블록. 마크다운 파서 없이, 글마다 이
 * 컴포넌트들을 직접 조합해서 작성한다 — 글 개수가 적고 자주 바뀌지 않아 파서를 두는 것보다
 * 단순하고, react-native-web/네이티브 양쪽에서 렌더링이 보장된다. */

export function H2({ children }: { children: string }) {
  return <Text className="text-lg font-bold text-slate-900">{children}</Text>;
}

export function P({ children }: { children: ReactNode }) {
  return <Text className="text-sm leading-6 text-slate-600">{children}</Text>;
}

export function Bold({ children }: { children: ReactNode }) {
  return <Text className="font-semibold text-slate-800">{children}</Text>;
}

export function Ul({ children }: { children: ReactNode }) {
  return <View className="gap-1.5">{children}</View>;
}

export function Li({ children }: { children: ReactNode }) {
  return (
    <View className="flex-row gap-2">
      <Text className="text-sm leading-6 text-slate-400">•</Text>
      <Text className="flex-1 text-sm leading-6 text-slate-600">{children}</Text>
    </View>
  );
}
