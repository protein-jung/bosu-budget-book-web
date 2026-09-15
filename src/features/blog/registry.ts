import { post as cardStatementAutoImport } from '@/features/blog/posts/card-statement-auto-import';
import { post as coupleBudgetShared } from '@/features/blog/posts/couple-budget-shared';
import { post as newlywedBudgetStart } from '@/features/blog/posts/newlywed-budget-start';
import type { BlogPost } from '@/features/blog/types';

// 최신순으로 유지한다 — 목록 페이지가 이 배열 순서 그대로 보여준다.
export const BLOG_POSTS: BlogPost[] = [newlywedBudgetStart, cardStatementAutoImport, coupleBudgetShared];

export function getBlogPost(slug: string | undefined): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
