import { Redirect } from 'expo-router';

/** 하단 탭의 "관리자" 버튼용 자리표시 화면 — 탭은 이 그룹((main)) 안의 파일이어야 등록되는데,
 * 실제 관리자 화면은 이 그룹 밖의 최상위 /admin 라우트라 눌리자마자 그쪽으로 넘긴다. */
export default function AdminTabRedirect() {
  return <Redirect href="/admin" />;
}
