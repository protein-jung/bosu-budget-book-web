import { useEffect, useRef, useState } from 'react';
import { Platform, Text, View } from 'react-native';

import { useInView } from '@/lib/useInView';

/** 뷰포트에 들어오면 0에서 목표값까지 세는 숫자 — 집계/잔고 섹션에서 "정산되는" 느낌을 준다. */
export function AnimatedStat({
  label,
  value,
  prefix = '',
  suffix = '',
  color = '#105753',
}: {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  color?: string;
}) {
  const { ref, inView } = useInView(0.4);
  const [display, setDisplay] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!inView || startedRef.current) return;
    startedRef.current = true;

    if (Platform.OS === 'web' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(value);
      return;
    }

    const duration = 1200;
    const startTime = Date.now();
    let raf: ReturnType<typeof requestAnimationFrame>;

    const tick = () => {
      const t = Math.min((Date.now() - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(value * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  return (
    // @ts-expect-error -- RNW forwards this ref to the underlying DOM node, which is what useInView needs.
    <View ref={ref}>
      <Text className="font-brand text-2xl" style={{ color }}>
        {prefix}
        {display.toLocaleString()}
        {suffix}
      </Text>
      <Text className="mt-0.5 text-xs text-slate-500">{label}</Text>
    </View>
  );
}
