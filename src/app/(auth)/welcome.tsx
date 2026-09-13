import { Link, router } from 'expo-router';
import Head from 'expo-router/head';
import { useEffect, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedStat } from '@/components/welcome/AnimatedStat';
import { HouseholdConnect } from '@/components/welcome/HouseholdConnect';
import { Reveal } from '@/components/welcome/Reveal';
import { Stamp } from '@/components/welcome/Stamp';
import { Footer } from '@/components/Footer';
import { useIsDesktop } from '@/lib/responsive';
import { useGoHome } from '@/lib/useGoHome';

type Feature = {
  key: string;
  eyebrow: string;
  title: string;
  body: string;
  image: number;
  stamp: string;
  stat?: { label: string; value: number; prefix?: string };
  showConnect?: boolean;
};

const FEATURES: Feature[] = [
  {
    key: 'household',
    eyebrow: '작성자',
    title: '초대코드 하나로, 우리 둘의 가계부',
    body: '배우자에게 초대코드만 보내면 같은 가계부에 들어와서 함께 기록해요. 누가 얼마를 썼는지 더 이상 카톡으로 캡처해서 보낼 필요 없어요.',
    image: require('../../../assets/marketing/preview-household.png'),
    stamp: '연결완료',
    showConnect: true,
  },
  {
    key: 'calendar',
    eyebrow: '날짜',
    title: '날짜를 누르면, 그날의 전부가 보여요',
    body: '캘린더에서 하루하루 수입·지출을 기록하고, 대분류를 누르면 이번 달 전체 내역이 한 번에 정리돼요.',
    image: require('../../../assets/marketing/preview-calendar.gif'),
    stamp: '기록완료',
  },
  {
    key: 'statistics',
    eyebrow: '집계',
    title: '숫자로 보면, 새는 곳이 보여요',
    body: '카테고리·카드·가족 구성원별로 얼마나 썼는지 도넛·막대 차트로 한눈에 보고, 예산을 정해두면 초과했을 때 바로 표시돼요.',
    image: require('../../../assets/marketing/preview-statistics.gif'),
    stamp: '집계완료',
    stat: { label: '예시 화면 속 이번 달 지출', value: 4088698, prefix: '₩' },
  },
  {
    key: 'assets',
    eyebrow: '잔고',
    title: '자산은, 흩어지지 않게',
    body: '부동산·차량·주식·코인·예적금·대출까지 한 곳에서. 매일 자정 스냅샷을 남겨서 최근 자산 변동 추이도 보여줘요.',
    image: require('../../../assets/marketing/preview-portfolio.gif'),
    stamp: '조회완료',
    stat: { label: '예시 화면 속 순자산', value: 762453434, prefix: '₩' },
  },
  {
    key: 'categories',
    eyebrow: '항목',
    title: '우리 집 방식대로, 항목을 정리해요',
    body: '대분류·소분류에 아이콘과 색을 입혀서, 우리 가계부만의 방식으로 정리할 수 있어요.',
    image: require('../../../assets/marketing/preview-categories.png'),
    stamp: '분류완료',
  },
  {
    key: 'import',
    eyebrow: '증빙',
    title: '명세서는, 올리기만 하면 끝',
    body: '삼성카드·경기지역화폐·쿠팡 내역을 올리면 가맹점 이름을 보고 카테고리까지 자동으로 분류돼요.',
    image: require('../../../assets/marketing/preview-import.gif'),
    stamp: '자동분류',
  },
];

function ScreenshotFrame({
  image,
  alt,
  stampLabel,
  delay = 0,
}: {
  image: number;
  alt: string;
  stampLabel?: string;
  delay?: number;
}) {
  const isDesktop = useIsDesktop();
  const { width: winWidth } = useWindowDimensions();
  const frameWidth = isDesktop ? 440 : Math.min(winWidth - 64, 380);
  const frameHeight = frameWidth * 0.8;

  return (
    <View style={{ width: frameWidth }}>
      <View
        className="overflow-hidden rounded-3xl border border-primary-light bg-white shadow-lg"
        style={{ width: frameWidth, height: frameHeight }}>
        <Image
          source={image}
          accessibilityLabel={alt}
          style={{ width: frameWidth, height: frameHeight }}
          resizeMode="contain"
          fadeDuration={0}
        />
      </View>
      {stampLabel ? <Stamp label={stampLabel} delay={delay + 260} /> : null}
    </View>
  );
}

function FeatureSection({
  feature,
  index,
  onLayout,
}: {
  feature: Feature;
  index: number;
  onLayout: (y: number) => void;
}) {
  const isDesktop = useIsDesktop();
  const reverse = isDesktop && index % 2 === 1;
  const isLast = index === FEATURES.length - 1;

  return (
    <View
      onLayout={(e) => onLayout(e.nativeEvent.layout.y)}
      className={`${isLast ? '' : 'border-b border-primary-light/60'} ${isDesktop ? 'py-20' : 'py-14'}`}>
      <View className={isDesktop ? `flex-row items-center gap-16 ${reverse ? 'flex-row-reverse' : ''}` : 'gap-8'}>
        <Reveal from={isDesktop ? (reverse ? 'right' : 'left') : 'up'} style={{ flex: isDesktop ? 1 : undefined }}>
          <View className="flex-row items-center gap-3">
            <Text className="font-brand text-xs tracking-[0.3em] text-secondary">{feature.eyebrow}</Text>
            {feature.showConnect ? <HouseholdConnect /> : null}
          </View>
          <Text
            className={`mt-3 font-bold text-slate-900 ${isDesktop ? 'text-4xl' : 'text-2xl'}`}
            style={{ maxWidth: isDesktop ? 460 : undefined }}>
            {feature.title}
          </Text>
          <Text
            className={`mt-4 text-slate-600 ${isDesktop ? 'text-base' : 'text-sm'} leading-6`}
            style={{ maxWidth: isDesktop ? 420 : undefined }}>
            {feature.body}
          </Text>
          {feature.stat ? (
            <View className="mt-6">
              <AnimatedStat label={feature.stat.label} value={feature.stat.value} prefix={feature.stat.prefix} />
            </View>
          ) : null}
        </Reveal>
        <Reveal
          from={isDesktop ? (reverse ? 'left' : 'right') : 'scale'}
          delay={100}
          style={{ alignSelf: isDesktop ? 'auto' : 'center' }}>
          <ScreenshotFrame image={feature.image} alt={feature.title} stampLabel={feature.stamp} />
        </Reveal>
      </View>
    </View>
  );
}

function IndexRail({ activeIndex, onSelect }: { activeIndex: number; onSelect: (index: number) => void }) {
  return (
    <View pointerEvents="box-none" className="absolute bottom-0 right-6 top-0 z-40 items-end justify-center">
      <View className="gap-5">
        {FEATURES.map((f, i) => {
          const active = i === activeIndex;
          return (
            <Pressable key={f.key} onPress={() => onSelect(i)} className="flex-row items-center gap-2 py-0.5">
              <Text className={`font-brand text-[11px] tracking-widest ${active ? 'text-secondary' : 'text-slate-300'}`}>
                {f.eyebrow}
              </Text>
              <View className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-secondary' : 'bg-primary/15'}`} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** 마운트 직후 한 프레임 뒤에 true — hero 진입 CSS transition을 트리거하기 위한 상태. */
function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return mounted;
}

export default function WelcomeScreen() {
  const isDesktop = useIsDesktop();
  const goHome = useGoHome();
  const mounted = useMounted();

  const scrollViewRef = useRef<ScrollView>(null);
  const sectionOffsets = useRef<number[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollMeta, setScrollMeta] = useState({ content: 1, viewport: 1 });

  const handleScroll = (y: number) => {
    setScrollTop(y);
    const offsets = sectionOffsets.current;
    let idx = 0;
    for (let i = 0; i < offsets.length; i++) {
      if (offsets[i] != null && y + 160 >= offsets[i]) idx = i;
    }
    setActiveIndex((prev) => (prev === idx ? prev : idx));
  };

  const heroStyle = (index: number) => ({
    opacity: mounted ? 1 : 0,
    transform: [{ translateY: mounted ? 0 : 16 }],
    transitionProperty: 'opacity, transform',
    transitionDuration: '600ms',
    transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
    transitionDelay: `${index * 140}ms`,
  });

  const scrollToIndex = (i: number) => {
    const y = sectionOffsets.current[i];
    if (y != null) scrollViewRef.current?.scrollTo({ y: Math.max(y - 32, 0), animated: true });
  };

  const maxScroll = Math.max(scrollMeta.content - scrollMeta.viewport, 1);
  const progressPct = Math.min(Math.max((scrollTop / maxScroll) * 100, 0), 100);

  return (
    <>
      <Head>
        <title>보수가계부 - 부부와 가족이 함께 쓰는 무료 가계부 앱</title>
        <meta
          name="description"
          content="달력에서 수입·지출을 기록하고 부동산·차량·주식 등 자산까지 한눈에 관리하세요. 카드 명세서 자동 입력도 지원해요."
        />
      </Head>
      <SafeAreaView className="relative flex-1 bg-cream" edges={['top', 'bottom']}>
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: 3,
            width: `${progressPct}%`,
            backgroundColor: '#E07A5F',
            zIndex: 50,
          }}
        />
        {isDesktop ? <IndexRail activeIndex={activeIndex} onSelect={scrollToIndex} /> : null}

        <ScrollView
          ref={scrollViewRef}
          onScroll={(e) => handleScroll(e.nativeEvent.contentOffset.y)}
          scrollEventThrottle={16}
          onContentSizeChange={(_w, h) => setScrollMeta((m) => ({ ...m, content: h }))}
          onLayout={(e) => setScrollMeta((m) => ({ ...m, viewport: e.nativeEvent.layout.height }))}
          contentContainerClassName="items-center px-5 pb-16 pt-8"
          className="flex-1">
          <View style={heroStyle(0)}>
            <Pressable onPress={goHome} className="items-center gap-0.5">
              <Text className="font-brand text-lg text-primary">BOSU Ledger</Text>
              <Text className="text-xs text-slate-400">보수가계부</Text>
            </Pressable>
          </View>

          <View style={[heroStyle(1), { marginTop: 20 }]}>
            <Text className="text-center text-xl font-bold text-slate-900">부부와 가족이 함께 쓰는 가계부</Text>
          </View>

          <View style={[heroStyle(2), { marginTop: 12 }]} className="items-center">
            <Image
              source={require('../../../assets/marketing/brand-tagline.png')}
              accessibilityLabel="Spend less, Keep more"
              resizeMode="contain"
              style={{ width: isDesktop ? 380 : 260, height: (isDesktop ? 380 : 260) * (803 / 1442) }}
            />
          </View>

          <View className={`w-full ${isDesktop ? 'max-w-[1040px]' : 'max-w-[520px]'}`}>
            <View className="mt-4">
              {FEATURES.map((feature, i) => (
                <FeatureSection
                  key={feature.key}
                  feature={feature}
                  index={i}
                  onLayout={(y) => {
                    sectionOffsets.current[i] = y;
                  }}
                />
              ))}
            </View>

            <View style={heroStyle(3)} className="items-center gap-3 border-t border-primary-light pt-10">
              <Pressable
                onPress={() => router.push('/signup')}
                className="w-full max-w-[320px] items-center rounded-xl bg-primary px-4 py-3.5 active:bg-primary-dark">
                <Text className="text-base font-semibold text-white">무료로 시작하기</Text>
              </Pressable>
              <View className="flex-row gap-1">
                <Text className="text-sm text-slate-500">이미 계정이 있으신가요?</Text>
                <Link href="/login" className="text-sm font-semibold text-primary">
                  로그인
                </Link>
              </View>
              <Text className="text-xs text-slate-400">📱 iOS·Android 앱도 준비 중입니다</Text>
            </View>

            <Footer />
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
