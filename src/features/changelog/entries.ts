/** 설정 > 업데이트 소식에 보여줄 큰 기능 배포 기록. 최신이 맨 위.
 * 작은 수정·버그 픽스는 남기지 않는다. requestedBy가 있으면 "OO님의 요청" 배지가 붙는다. */
export type ChangelogEntry = {
  date: string; // YYYY-MM-DD
  title: string;
  description: string;
  requestedBy?: string;
};

export const CHANGELOG: ChangelogEntry[] = [
  {
    date: '2026-08-06',
    title: '보수가계부 개발 시작',
    description: '함께 쓰는 가계부, 보수가계부의 첫 코드를 작성했어요. 여기서부터 모든 게 시작됐어요.',
  },
];
