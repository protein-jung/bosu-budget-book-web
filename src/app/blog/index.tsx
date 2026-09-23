import { router } from 'expo-router';
import Head from 'expo-router/head';
import { Pressable, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { BLOG_POSTS } from '@/features/blog/registry';

const SITE_URL = 'https://bosuledger.com';
const TITLE = '블로그 | 보수가계부 (BOSU Ledger)';
const DESCRIPTION = '부부·가족·신혼부부를 위한 가계부·자산관리 이야기. 보수가계부가 정리한 실전 팁을 모았습니다.';

function displayDate(publishedAt: string) {
  return publishedAt.replaceAll('-', '.');
}

const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@type': 'Blog',
  name: '보수가계부 블로그',
  url: `${SITE_URL}/blog`,
  blogPost: BLOG_POSTS.map((post) => ({
    '@type': 'BlogPosting',
    headline: post.title,
    url: `${SITE_URL}/blog/${post.slug}`,
    datePublished: post.publishedAt,
  })),
};

export default function BlogIndexScreen() {
  return (
    <>
      <Head>
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:url" content={`${SITE_URL}/blog`} />
        <script type="application/ld+json">{JSON.stringify(STRUCTURED_DATA)}</script>
      </Head>
      <Screen maxWidthClassName="max-w-[720px]" backgroundClassName="bg-white" footer topInset>
        <View className="gap-1">
          <Pressable onPress={() => router.back()} className="mb-1 self-start">
            <Text className="text-sm font-medium text-primary">‹ 뒤로</Text>
          </Pressable>
          <Text className="text-2xl font-bold text-slate-900">블로그</Text>
          <Text className="text-sm leading-6 text-slate-500">
            부부·가족·신혼부부를 위한 가계부와 자산관리 이야기를 정리합니다.
          </Text>
        </View>

        <View className="gap-4">
          {BLOG_POSTS.map((post) => (
            <Pressable
              key={post.slug}
              onPress={() => router.push(`/blog/${post.slug}`)}
              className="gap-1.5 rounded-2xl border border-slate-100 p-5 active:bg-slate-50">
              <Text className="text-xs text-slate-400">{displayDate(post.publishedAt)}</Text>
              <Text className="text-base font-bold text-slate-900">{post.title}</Text>
              <Text className="text-sm leading-6 text-slate-500">{post.summary}</Text>
            </Pressable>
          ))}
        </View>
      </Screen>
    </>
  );
}
