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
    date: '2026-09-22',
    title: '앱 푸시 알림',
    description: '새 내역 등록이나 댓글을 휴대폰 푸시 알림으로 바로 받아볼 수 있어요.',
  },
  {
    date: '2026-09-15',
    title: '적금 납입 자동 누적',
    description: '월 납입액을 넣어두면 적금 잔액이 매달 자동으로 쌓이고, 납입 내역도 볼 수 있어요.',
    requestedBy: '최*우',
  },
  {
    date: '2026-09-11',
    title: '모바일 하단 메뉴',
    description: '캘린더·통계·자산·설정과 + 버튼을 화면 아래에 모아서 한 손으로 쓰기 편해졌어요.',
  },
  {
    date: '2026-09-11',
    title: '예산 사용률 표시',
    description: '캘린더에서 대분류별 예산 대비 사용률을 막대로 보여주고, 넘으면 빨간색으로 알려줘요.',
  },
  {
    date: '2026-09-10',
    title: '월별 통계 코멘트',
    description: '달마다 한 줄 코멘트를 남겨서 그달의 소비를 돌아볼 수 있어요.',
    requestedBy: '김*수',
  },
  {
    date: '2026-09-10',
    title: '내역에 댓글 달기',
    description: '지출·수입 내역마다 함께 쓰는 사람과 채팅처럼 댓글을 주고받을 수 있어요.',
    requestedBy: '박*영',
  },
  {
    date: '2026-08-13',
    title: '대분류 카테고리',
    description: '카테고리를 대분류로 묶어서 관리하고, 대분류 단위로 합계를 볼 수 있어요.',
  },
  {
    date: '2026-08-13',
    title: '자산 포트폴리오',
    description: '차량 실시세, 대출 상환, 예금·적금 이자, 자산 추이 그래프로 우리 집 자산을 한곳에서 봐요.',
  },
  {
    date: '2026-08-11',
    title: '쿠팡 주문내역 가져오기',
    description: '크롬 확장으로 뽑은 쿠팡 CSV를 올리면 상품별로 거래가 등록되고, 취소·반품은 자동으로 빠져요.',
    requestedBy: '이*진',
  },
  {
    date: '2026-08-10',
    title: '통계와 캘린더 한눈에 보기',
    description: '월별 통계 그래프와 대분류별·사람별·카드별 사용 내역을 캘린더에서 바로 볼 수 있어요.',
  },
  {
    date: '2026-08-06',
    title: '보수가계부 개발 시작',
    description: '함께 쓰는 가계부, 보수가계부의 첫 코드를 작성했어요. 여기서부터 모든 게 시작됐어요.',
  },
];
