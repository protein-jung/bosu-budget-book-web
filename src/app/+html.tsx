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
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
