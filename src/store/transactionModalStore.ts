import { create } from 'zustand';

import { toDateKey } from '@/lib/calendar';

type TransactionModalState = {
  visible: boolean;
  dateKey: string;
  open: () => void;
  close: () => void;
};

/** 하단 메뉴바의 + 버튼처럼, 지금 보고 있는 화면이 무엇이든 상관없이 내역 추가 팝업을
 * 열어야 하는 진입점을 위한 전역 상태. 달력 화면 안에서 여는 기존 흐름(날짜/타입을
 * 미리 정해서 여는 것)은 그 화면이 직접 모달을 들고 있으니 이 스토어를 쓰지 않는다. */
export const useTransactionModalStore = create<TransactionModalState>((set) => ({
  visible: false,
  dateKey: toDateKey(new Date()),
  open: () => set({ visible: true, dateKey: toDateKey(new Date()) }),
  close: () => set({ visible: false }),
}));
