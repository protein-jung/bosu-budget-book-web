import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

/**
 * 요소가 뷰포트에 처음 들어오는 순간을 감지한다 (스크롤 리빌용).
 * 웹 IntersectionObserver 기반이라 네이티브/SSR/구형 브라우저에서는 즉시 true로 떨어져서
 * 애니메이션 없이 항상 보이는 상태로 안전하게 폴백한다. prefers-reduced-motion도 같은 방식으로 존중.
 */
export function useInView(threshold = 0.2) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setInView(true);
      return;
    }
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setInView(true);
      return;
    }
    const node = ref.current as unknown as Element | null;
    if (!node) {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
            observer.disconnect();
          }
        });
      },
      { threshold }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView } as const;
}
