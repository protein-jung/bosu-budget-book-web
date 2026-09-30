import axios, { type AxiosError } from 'axios';
import { Platform } from 'react-native';

type ClientError = { method: string; url: string; message: string; platform: string; occurredAt: string };

const MAX_PENDING = 20;
let pending: ClientError[] = [];

/** 서버 응답을 아예 못 받은 API 실패(네트워크 끊김·타임아웃·서버 다운)를 백엔드로 보고한다 — 백엔드가
 * 슬랙으로 넘긴다. 5xx 등 응답이 온 에러는 백엔드가 이미 직접 보내므로 여기서는 보내지 않는다.
 * 서버가 죽어서 보고도 실패하면 모아뒀다가 다음 요청이 성공할 때 flushClientErrors로 보낸다. */
export function reportIfNoResponse(error: unknown, baseURL: string) {
  if (!axios.isAxiosError(error) || error.response || axios.isCancel(error)) return;
  const e = error as AxiosError;
  if (e.config?.url?.includes('/api/analytics/client-error')) return;
  pending.push({
    method: (e.config?.method ?? '').toUpperCase(),
    url: e.config?.url ?? '',
    message: `${e.code ?? ''} ${e.message}`.trim().slice(0, 1000),
    platform: Platform.OS,
    occurredAt: new Date().toISOString(),
  });
  pending = pending.slice(-MAX_PENDING);
  flushClientErrors(baseURL);
}

export function flushClientErrors(baseURL: string) {
  if (pending.length === 0) return;
  const batch = pending;
  pending = [];
  // 인터셉터를 다시 타지 않도록 apiClient가 아닌 기본 axios로 보낸다.
  for (const item of batch) {
    axios.post(`${baseURL}/api/analytics/client-error`, item, { timeout: 5000 }).catch(() => {
      pending = [...pending, item].slice(-MAX_PENDING);
    });
  }
}
