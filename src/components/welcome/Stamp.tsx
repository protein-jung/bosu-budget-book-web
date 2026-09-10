import { Text, View } from 'react-native';

import { Reveal } from './Reveal';

/** 증빙에 도장 찍히듯, 각 기능 스크린샷 모서리에 붙는 확인 도장. */
export function Stamp({ label, delay = 0 }: { label: string; delay?: number }) {
  return (
    <Reveal from="stamp" delay={delay} threshold={0.35} style={{ position: 'absolute', top: -16, right: -16, zIndex: 10 }}>
      <View className="h-[68px] w-[68px] items-center justify-center rounded-full border-2 border-secondary bg-cream shadow-md">
        <Text className="px-1 text-center font-brand text-[10px] leading-[13px] text-secondary">{label}</Text>
      </View>
    </Reveal>
  );
}
