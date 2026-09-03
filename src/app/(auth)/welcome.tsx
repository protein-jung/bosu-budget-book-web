import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { useRef, useState } from 'react';
import { Animated, Image, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Footer } from '@/components/Footer';
import { useIsDesktop } from '@/lib/responsive';
import { useGoHome } from '@/lib/useGoHome';

const PREVIEWS = [
  {
    image: require('../../../assets/marketing/preview-calendar.png'),
    title: '하루하루, 한눈에',
    caption: '달력에서 바로 수입·지출을 기록하고 대분류별·사람별·카드별로 자동 정리돼요.',
  },
  {
    image: require('../../../assets/marketing/preview-statistics.png'),
    title: '몇 달치를 나란히',
    caption: '거래를 처음 기록한 달부터 이번 달까지, 카테고리별 흐름을 표로 한눈에 볼 수 있어요.',
  },
  {
    image: require('../../../assets/marketing/preview-portfolio.png'),
    title: '자산은 모두 한 곳에',
    caption: '부동산·차량·주식·코인·대출까지, 실시간 시세와 손익률을 함께 확인하세요.',
  },
];

const SLIDE_DURATION_MS = 320;

// 양 끝에 반대쪽 이미지를 하나씩 더 붙여서(마지막-앞, 처음-뒤), 끝에서 다음/이전으로 넘겨도
// 항상 같은 방향으로 자연스럽게 슬라이드된 다음 애니메이션 없이 순간적으로 진짜 위치로 복귀시킨다.
const SLIDE_STRIP = [PREVIEWS[PREVIEWS.length - 1], ...PREVIEWS, PREVIEWS[0]];
const START_POS = 1;

function PreviewCarousel() {
  const [realIndex, setRealIndex] = useState(0);
  const posRef = useRef(START_POS);
  const [isAnimating, setIsAnimating] = useState(false);
  const { width: winWidth } = useWindowDimensions();
  const cardWidth = Math.min(winWidth - 40, 800);
  const cardHeight = cardWidth * 0.75;
  const [translateX] = useState(() => new Animated.Value(-START_POS * cardWidth));

  const goTo = (direction: 1 | -1) => {
    if (isAnimating) return;
    setIsAnimating(true);
    const nextPos = posRef.current + direction;
    posRef.current = nextPos;
    setRealIndex((nextPos - 1 + PREVIEWS.length) % PREVIEWS.length);
    Animated.timing(translateX, {
      toValue: -nextPos * cardWidth,
      duration: SLIDE_DURATION_MS,
      useNativeDriver: true,
    }).start(() => {
      if (nextPos === SLIDE_STRIP.length - 1) {
        posRef.current = START_POS;
        translateX.setValue(-START_POS * cardWidth);
      } else if (nextPos === 0) {
        posRef.current = PREVIEWS.length;
        translateX.setValue(-PREVIEWS.length * cardWidth);
      }
      setIsAnimating(false);
    });
  };

  const current = PREVIEWS[realIndex];

  return (
    <View className="items-center gap-4">
      <View
        style={{ width: cardWidth }}
        className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-lg dark:border-slate-700 dark:bg-slate-800">
        <View className="flex-row items-center gap-1.5 px-4 py-3">
          <View className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <View className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <View className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </View>
        <View style={{ width: cardWidth, height: cardHeight }} className="overflow-hidden bg-white dark:bg-slate-900">
          <Animated.View
            style={{ flexDirection: 'row', width: cardWidth * SLIDE_STRIP.length, transform: [{ translateX }] }}>
            {SLIDE_STRIP.map((p, i) => (
              <Image
                key={`${p.title}-${i}`}
                source={p.image}
                style={{ width: cardWidth, height: cardHeight }}
                resizeMode="contain"
              />
            ))}
          </Animated.View>

          <Pressable
            onPress={() => goTo(-1)}
            hitSlop={8}
            style={{ top: cardHeight / 2 - 20 }}
            className="absolute left-3 h-10 w-10 items-center justify-center rounded-full bg-black/45 active:bg-black/60">
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>
          <Pressable
            onPress={() => goTo(1)}
            hitSlop={8}
            style={{ top: cardHeight / 2 - 20 }}
            className="absolute right-3 h-10 w-10 items-center justify-center rounded-full bg-black/45 active:bg-black/60">
            <Ionicons name="chevron-forward" size={22} color="#fff" />
          </Pressable>
        </View>
      </View>
      <View className="items-center gap-1 px-4">
        <Text className="text-base font-bold text-slate-900 dark:text-white">{current.title}</Text>
        <Text className="max-w-[440px] text-center text-sm text-slate-500 dark:text-slate-400">
          {current.caption}
        </Text>
      </View>
      <View className="flex-row gap-1.5">
        {PREVIEWS.map((p, i) => (
          <View
            key={p.title}
            className={`h-1.5 rounded-full ${i === realIndex ? 'w-5 bg-primary' : 'w-1.5 bg-primary/35'}`}
          />
        ))}
      </View>
    </View>
  );
}

export default function WelcomeScreen() {
  const isDesktop = useIsDesktop();
  const goHome = useGoHome();

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top', 'bottom']}>
      <ScrollView contentContainerClassName="items-center gap-10 px-5 pb-16 pt-8" className="flex-1">
        <Pressable onPress={goHome} className="items-center gap-0.5">
          <Text className="font-brand text-lg text-primary dark:text-secondary">🏠 BOSU Ledger</Text>
          <Text className="text-xs text-slate-400">보수가계부</Text>
        </Pressable>

        <View className={`w-full gap-14 ${isDesktop ? 'max-w-[880px]' : 'max-w-[520px]'}`}>
          <PreviewCarousel />

          <Text className="max-w-[420px] self-center text-center text-2xl font-bold text-slate-900 dark:text-white">
            덜 쓰고, 더 남기고.
          </Text>

          <View className="items-center gap-3 border-t border-primary-light pt-8 dark:border-slate-800">
            <Pressable
              onPress={() => router.push('/signup')}
              className="w-full max-w-[320px] items-center rounded-xl bg-primary px-4 py-3.5 active:bg-primary-dark">
              <Text className="text-base font-semibold text-white">무료로 시작하기</Text>
            </Pressable>
            <View className="flex-row gap-1">
              <Text className="text-sm text-slate-500 dark:text-slate-400">이미 계정이 있으신가요?</Text>
              <Link href="/login" className="text-sm font-semibold text-primary dark:text-secondary">
                로그인
              </Link>
            </View>
          </View>

          <Footer />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
