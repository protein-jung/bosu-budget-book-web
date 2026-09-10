import { View, type ViewProps, type ViewStyle } from 'react-native';

import { useInView } from '@/lib/useInView';

type RevealFrom = 'up' | 'left' | 'right' | 'scale' | 'stamp';

type RevealProps = ViewProps & {
  children: React.ReactNode;
  delay?: number;
  from?: RevealFrom;
  threshold?: number;
};

const DIST = 26;

function restingTransform(from: RevealFrom): ViewStyle['transform'] {
  if (from === 'stamp') return [{ scale: 1 }, { rotate: '-8deg' }];
  if (from === 'scale') return [{ scale: 1 }];
  return [{ translateX: 0 }, { translateY: 0 }];
}

function hiddenTransform(from: RevealFrom): ViewStyle['transform'] {
  if (from === 'stamp') return [{ scale: 0.5 }, { rotate: '-16deg' }];
  if (from === 'scale') return [{ scale: 0.92 }];
  if (from === 'left') return [{ translateX: -DIST }, { translateY: 0 }];
  if (from === 'right') return [{ translateX: DIST }, { translateY: 0 }];
  return [{ translateX: 0 }, { translateY: DIST }];
}

/**
 * 스크롤로 뷰포트에 들어오는 순간 한 번 재생되는 등장 애니메이션.
 * 이 페이지는 웹 전용이라 RN Animated 대신 웹 네이티브 CSS transition을 직접 건다
 * (React Compiler와 Animated의 imperative 업데이트가 충돌해 값이 반영되지 않는 문제가 있었음).
 */
export function Reveal({ children, delay = 0, from = 'up', threshold = 0.2, style, ...rest }: RevealProps) {
  const { ref, inView } = useInView(threshold);
  const duration = from === 'stamp' ? 650 : 700;
  const easing = from === 'stamp' ? 'cubic-bezier(0.34, 1.56, 0.64, 1)' : 'cubic-bezier(0.16, 1, 0.3, 1)';

  return (
    <View
      // @ts-expect-error -- RNW forwards this ref to the underlying DOM node, which is what useInView needs.
      ref={ref}
      style={[
        style,
        {
          opacity: inView ? 1 : 0,
          transform: inView ? restingTransform(from) : hiddenTransform(from),
          // @ts-expect-error -- web-only CSS transition props, passed straight through by RNW.
          transitionProperty: 'opacity, transform',
          transitionDuration: `${duration}ms`,
          transitionTimingFunction: easing,
          transitionDelay: `${delay}ms`,
        },
      ]}
      {...rest}>
      {children}
    </View>
  );
}
