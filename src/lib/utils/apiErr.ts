import axios from 'axios';
import type { ApiErrorResponseData } from '@/types';

export function apiErr(e: unknown) {
  if (axios.isAxiosError(e)) {
    const d = e.response?.data as ApiErrorResponseData;
    return d?.error?.message ?? e.message;
  }
  if (e instanceof Error) return e.message;
  return 'Ошибка запроса';
}
