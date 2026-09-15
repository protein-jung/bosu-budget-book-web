import { storage } from '@/lib/storage';

const VISITOR_ID_KEY = 'housebook_visitor_id';

function randomId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** 접속 통계에서 순 방문자를 셀 때 쓰는, 기기/브라우저에 저장된 익명 식별자. 로그인
 * 여부와 무관하게 한 번 생성되면 계속 재사용된다. */
export async function getOrCreateVisitorId(): Promise<string> {
  const existing = await storage.getItem(VISITOR_ID_KEY);
  if (existing) return existing;
  const id = randomId();
  await storage.setItem(VISITOR_ID_KEY, id);
  return id;
}
