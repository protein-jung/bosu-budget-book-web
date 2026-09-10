import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

/**
 * expo-router 정적 웹 출력의 루트 HTML 셸. Node.js에서 빌드 시 한 번 렌더링된다.
 * title/description/OG 등 SEO 메타는 여기 두지 않는다 — src/app/_layout.tsx의
 * expo-router/head <Head>(react-helmet-async)가 전역 기본값과 페이지별 오버라이드를
 * 전부 관리하므로, 여기서 또 <title> 등을 하드코딩하면 head에 중복 태그가 생긴다.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="ko">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#F4EBDD" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
        {/* 아이폰에서 "홈 화면에 추가"로 설치했을 때 주소창/하단 바 없이 앱처럼 뜨게 한다.
            단, 이건 iOS의 Safari가 "홈 화면에 추가"할 때만 적용된다 — 크롬 등 다른 브라우저는
            iOS에서 이 기능 자체를 지원하지 않아서(애플이 서드파티 브라우저엔 막아둠), 아무리
            메타 태그를 넣어도 크롬으로 추가하면 주소창 있는 채로 열린다. */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="보수가계부" />
        <meta name="mobile-web-app-capable" content="yes" />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
