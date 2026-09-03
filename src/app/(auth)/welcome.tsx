import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import Head from 'expo-router/head';
import { useRef, useState } from 'react';
import { Animated, Image, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Footer } from '@/components/Footer';
import { useIsDesktop } from '@/lib/responsive';
import { useGoHome } from '@/lib/useGoHome';

const PREVIEWS = [
  {
    image: require('../../../assets/marketing/preview-calendar.gif'),
    title: '하루하루, 한눈에',
    caption: '날짜를 누르면 그날의 수입·지출이, 대분류를 누르면 이번 달 전체 내역이 바로 정리돼요.',
  },
  {
    image: require('../../../assets/marketing/preview-statistics.gif'),
    title: '몇 달치를 나란히',
    caption: '금액을 누르면 그 카테고리·그 달에 실제로 쓴 내역이 목록으로 바로 열려요.',
  },
  {
    image: require('../../../assets/marketing/preview-portfolio.gif'),
    title: '자산은 모두 한 곳에',
    caption: '부동산·차량·주식·코인·금·은·대출까지, 실시간 시세와 1년 추이를 함께 확인하세요.',
  },
  {
    image: require('../../../assets/marketing/preview-categories.png'),
    title: '내 손에 맞게 정리',
    caption: '대분류·소분류에 아이콘과 색을 입혀서, 우리 가계부만의 방식으로 정리할 수 있어요.',
  },
  {
    image: require('../../../assets/marketing/preview-import.gif'),
    title: '명세서는 올리기만',
    caption: '카드 명세서 파일을 올리면 가맹점 이름을 보고 카테고리까지 자동으로 분류돼요.',
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
    <>
      <Head>
        <title>보수가계부 - 부부와 가족이 함께 쓰는 무료 가계부 앱 | BOSU Ledger</title>
        <meta
          name="description"
          content="달력에서 바로 수입·지출을 기록하고, 부동산·차량·주식·예적금·대출까지 자산을 한눈에 관리하세요. 카드 명세서 자동 입력을 지원하는 부부·가족 공유 가계부, 보수가계부."
        />
      </Head>
      <SafeAreaView className="flex-1 bg-cream" edges={['top', 'bottom']}>
        <ScrollView contentContainerClassName="items-center gap-10 px-5 pb-16 pt-8" className="flex-1">
          <Pressable onPress={goHome} className="items-center gap-0.5">
            <Text className="font-brand text-lg text-primary dark:text-secondary">🏠 BOSU Ledger</Text>
            <Text className="text-xs text-slate-400">보수가계부</Text>
          </Pressable>

          <View className={`w-full gap-14 ${isDesktop ? 'max-w-[880px]' : 'max-w-[520px]'}`}>
            <PreviewCarousel />

            <View className="items-center gap-2">
              <Text className="max-w-[420px] text-center text-2xl font-bold text-slate-900 dark:text-white">
                덜 쓰고, 더 남기고.
              </Text>
              <Text className="max-w-[420px] text-center text-base font-semibold uppercase tracking-[0.2em] text-primary/50 dark:text-secondary/60">
                Spend less · Keep more
              </Text>
            </View>

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
              <Text className="text-xs text-slate-400 dark:text-slate-500">📱 iOS·Android 앱도 준비 중입니다</Text>
            </View>

            <Footer />
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
