import type { NextRequest } from 'next/server';
import { ApiError } from '@/lib/ApiError';

export function getLlmRateLimitClientId(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]!.trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real.trim();
  return 'local';
}

const buckets = new Map<string, number[]>();

function windowMs(): number {
  const w = Number(process.env.LLM_RATE_LIMIT_WINDOW_MS);
  return Number.isFinite(w) && w > 0 ? w : 60_000;
}

function maxPerWindow(): number {
  const m = Number(process.env.LLM_RATE_LIMIT_MAX);
  if (Number.isFinite(m) && m >= 0) return m;
  return 30;
}

export function assertLlmRateLimit(req: NextRequest): void {
  const max = maxPerWindow();
  if (max === 0) return;

  const id = getLlmRateLimitClientId(req);
  const now = Date.now();
  const win = windowMs();
  const key = `llm:${id}`;
  const prev = buckets.get(key) ?? [];
  const fresh = prev.filter((t) => now - t < win);

  if (fresh.length >= max) {
    throw new ApiError(
      429,
      'RATE_LIMIT_EXCEEDED',
      'Слишком много запросов к LLM, попробуйте позже'
    );
  }

  fresh.push(now);
  buckets.set(key, fresh);
}

export function resetLlmRateLimitForTests(): void {
  buckets.clear();
}
