import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  const Wrapper = scroll ? ScrollView : View;
  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={['top', 'bottom']}>
      <Wrapper
        className="mx-auto w-full max-w-[480px] flex-1"
        contentContainerClassName={scroll ? 'gap-4 p-5' : undefined}
        style={scroll ? undefined : { flex: 1, padding: 20, gap: 16 }}>
        {children}
      </Wrapper>
    </SafeAreaView>
  );
}
