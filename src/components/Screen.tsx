import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function Screen({
  children,
  scroll = true,
  maxWidthClassName = 'max-w-[480px]',
}: {
  children: ReactNode;
  scroll?: boolean;
  maxWidthClassName?: string;
}) {
  const Wrapper = scroll ? ScrollView : View;
  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top', 'bottom']}>
      <Wrapper
        className={`mx-auto w-full ${maxWidthClassName} flex-1`}
        contentContainerClassName={scroll ? 'gap-4 p-5' : undefined}
        style={scroll ? undefined : { flex: 1, padding: 20, gap: 16 }}>
        {children}
      </Wrapper>
    </SafeAreaView>
  );
}
