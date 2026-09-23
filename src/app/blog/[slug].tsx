import { Link, router, useLocalSearchParams } from 'expo-router';
import Head from 'expo-router/head';
import { Pressable, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { BLOG_POSTS, getBlogPost } from '@/features/blog/registry';

const SITE_URL = 'https://bosuledger.com';
const OG_IMAGE = `${SITE_URL}/og-image.png`;

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

function displayDate(publishedAt: string) {
  return publishedAt.replaceAll('-', '.');
}

export default function BlogPostScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const post = getBlogPost(slug);

  if (!post) {
    return (
      <Screen backgroundClassName="bg-white" topInset>
        <Text className="text-base text-slate-500">글을 찾을 수 없어요.</Text>
        <Link href="/blog" className="text-sm font-semibold text-primary">
          블로그 목록으로
        </Link>
      </Screen>
    );
  }

  const url = `${SITE_URL}/blog/${post.slug}`;
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    url,
    datePublished: post.publishedAt,
    author: { '@type': 'Organization', name: '보수가계부' },
    publisher: { '@type': 'Organization', name: '보수가계부' },
    mainEntityOfPage: url,
  };

  return (
    <>
      <Head>
        <title>{post.title} | 보수가계부 블로그</title>
        <meta name="description" content={post.description} />
        <meta name="keywords" content={post.keywords} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.description} />
        <meta property="og:url" content={url} />
        <meta property="og:image" content={OG_IMAGE} />
        <meta property="article:published_time" content={post.publishedAt} />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Head>
      <Screen maxWidthClassName="max-w-[720px]" backgroundClassName="bg-white" footer topInset>
        <View className="gap-1">
          <Pressable onPress={() => router.push('/blog')} className="mb-1 self-start">
            <Text className="text-sm font-medium text-primary">‹ 블로그 목록</Text>
          </Pressable>
          <Text className="text-2xl font-bold text-slate-900">{post.title}</Text>
          <Text className="text-xs text-slate-400">{displayDate(post.publishedAt)}</Text>
        </View>

        <post.Content />
      </Screen>
    </>
  );
}
