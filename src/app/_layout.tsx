import '../global.css';

import { SpaceMono_700Bold } from '@expo-google-fonts/space-mono';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Slot } from 'expo-router';
import Head from 'expo-router/head';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastHost } from '@/components/ToastHost';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/store/authStore';

// 웹 정적 export(Node.js)에서는 window/document가 없다 — 이때는 로딩 게이트를 건너뛰고
// 실제 화면(및 페이지별 <Head> 태그)을 그대로 정적 HTML에 구워 넣는다. 실제 브라우저/네이티브
// 런타임에서는 항상 document/window가 있으므로 이 분기의 영향을 받지 않는다.
const isStaticWebExport = Platform.OS === 'web' && typeof document === 'undefined';

const SITE_URL = 'https://bosuledger.com';
const DEFAULT_TITLE = '보수가계부 - 부부와 가족이 함께 쓰는 무료 가계부 앱';
const DEFAULT_DESCRIPTION =
  '부부·가족이 함께 쓰는 무료 공유 가계부. 지출·수입 기록, 통계, 부동산·차량·주식 자산 관리까지 한 곳에서.';
const KEYWORDS =
  '가계부, 부부 가계부, 가족 가계부, 공유 가계부, 무료 가계부 앱, 지출 관리, 예산 관리, ' +
  '자산 관리, 순자산 관리, 카드 명세서 자동입력, 보수가계부, BOSU Ledger';
const OG_IMAGE = `${SITE_URL}/og-image.png`;

// 사이트 전역 기본 메타 — 페이지별 <Head>(welcome/login/signup/terms/privacy 등)가 렌더되면
// react-helmet-async가 태그 단위로 이 기본값을 덮어쓴다. 모든 라우트를 감싸는 이 레이아웃에
// 두어야 <Head> 없는 화면(캘린더 등)에도 최소한의 title/description이 항상 적용된다.
function DefaultSeoHead() {
  return (
    <Head>
      <title>{DEFAULT_TITLE}</title>
      <meta name="description" content={DEFAULT_DESCRIPTION} />
      <meta name="keywords" content={KEYWORDS} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="보수가계부 (BOSU Ledger)" />
      <meta property="og:locale" content="ko_KR" />
      <meta property="og:title" content={DEFAULT_TITLE} />
      <meta property="og:description" content={DEFAULT_DESCRIPTION} />
      <meta property="og:url" content={SITE_URL} />
      <meta property="og:image" content={OG_IMAGE} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={DEFAULT_TITLE} />
      <meta name="twitter:description" content={DEFAULT_DESCRIPTION} />
      <meta name="twitter:image" content={OG_IMAGE} />
    </Head>
  );
}

export default function RootLayout() {
  const hydrate = useAuthStore((state) => state.hydrate);
  const hydrated = useAuthStore((state) => state.hydrated);
  const [hydrationStarted, setHydrationStarted] = useState(false);
  const [fontsLoaded] = useFonts({ SpaceMono_700Bold });

  useEffect(() => {
    if (!hydrationStarted) {
      setHydrationStarted(true);
      hydrate();
    }
  }, [hydrationStarted, hydrate]);

  if (!isStaticWebExport && (!hydrated || !fontsLoaded)) {
    return (
      <>
        <DefaultSeoHead />
        <View className="flex-1 items-center justify-center bg-cream dark:bg-slate-950">
          <ActivityIndicator size="large" />
        </View>
      </>
    );
  }

  return (
    <>
      <DefaultSeoHead />
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <Slot />
            <ToastHost />
          </QueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </>
  );
}
