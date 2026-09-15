import type { ComponentType } from 'react';

export type BlogPost = {
  slug: string;
  /** <title>·OG title. 검색 결과에 그대로 노출되므로 핵심 키워드를 앞쪽에 둔다. */
  title: string;
  /** meta description·OG description. */
  description: string;
  keywords: string;
  /** YYYY-MM-DD. JSON-LD datePublished와 목록 페이지 표시에 쓴다. */
  publishedAt: string;
  /** 목록 페이지 카드에 보여줄 한두 문장 요약. */
  summary: string;
  Content: ComponentType;
};
