import { View } from 'react-native';

import { useInView } from '@/lib/useInView';

/** 두 사람을 상징하는 점 두 개가 가운데서 만나는 미니 인터랙션 — "함께 쓰는 가계부" 섹션 전용. */
export function HouseholdConnect() {
  const { ref, inView } = useInView(0.4);
  const dotTransition = { transitionProperty: 'transform', transitionDuration: '600ms', transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' };

  return (
    // @ts-expect-error -- RNW forwards this ref to the underlying DOM node, which is what useInView needs.
    <View ref={ref} style={{ width: 72, height: 28, justifyContent: 'center' }}>
      <View
        style={[
          {
            position: 'absolute',
            left: '50%',
            top: 13,
            width: 44,
            height: 2,
            marginLeft: -22,
            backgroundColor: '#E3E2F8',
            opacity: inView ? 1 : 0,
            // @ts-expect-error -- web-only CSS transition, passed straight through by RNW.
            transitionProperty: 'opacity',
            transitionDuration: '300ms',
            transitionDelay: '500ms',
          },
        ]}
      />
      <View
        style={[
          {
            position: 'absolute',
            left: '50%',
            top: 4,
            marginLeft: -10,
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: '#02007D',
            transform: [{ translateX: inView ? 0 : -20 }],
          },
          dotTransition,
        ]}
      />
      <View
        style={[
          {
            position: 'absolute',
            left: '50%',
            top: 4,
            marginLeft: -10,
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: '#E07A5F',
            transform: [{ translateX: inView ? 0 : 20 }],
          },
          dotTransition,
        ]}
      />
    </View>
  );
}
