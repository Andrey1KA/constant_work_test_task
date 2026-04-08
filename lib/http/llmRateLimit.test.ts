import { describe, it, expect, vi, afterEach } from 'vitest';
import type { NextRequest } from 'next/server';
import { ApiError } from '@/lib/ApiError';
import {
  assertLlmRateLimit,
  getLlmRateLimitClientId,
  resetLlmRateLimitForTests,
} from '@/lib/http/llmRateLimit';

function mockReq(headers: Record<string, string>): NextRequest {
  return {
    headers: { get: (k: string) => headers[k] ?? null },
  } as NextRequest;
}

describe('llmRateLimit', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    resetLlmRateLimitForTests();
  });

  it('getLlmRateLimitClientId берёт первый IP из x-forwarded-for', () => {
    expect(
      getLlmRateLimitClientId(
        mockReq({ 'x-forwarded-for': ' 1.1.1.1 , 2.2.2.2 ' })
      )
    ).toBe('1.1.1.1');
  });

  it('после max запросов в окне выбрасывает 429', () => {
    vi.stubEnv('LLM_RATE_LIMIT_MAX', '2');
    vi.stubEnv('LLM_RATE_LIMIT_WINDOW_MS', '60000');
    const r = mockReq({ 'x-forwarded-for': '9.9.9.9' });
    assertLlmRateLimit(r);
    assertLlmRateLimit(r);
    expect(() => assertLlmRateLimit(r)).toThrow(ApiError);
    try {
      assertLlmRateLimit(r);
    } catch (e) {
      expect(e).toMatchObject({ status: 429, code: 'RATE_LIMIT_EXCEEDED' });
    }
  });

  it('при LLM_RATE_LIMIT_MAX=0 лимит отключён', () => {
    vi.stubEnv('LLM_RATE_LIMIT_MAX', '0');
    const r = mockReq({ 'x-forwarded-for': '8.8.8.8' });
    for (let i = 0; i < 50; i++) assertLlmRateLimit(r);
  });
});
