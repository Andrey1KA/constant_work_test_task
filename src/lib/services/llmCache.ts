import { createHash } from 'crypto';
import type { Maybe, Nullable } from '@/types';

type CacheEntry = { value: string; expiresAt: number };

const store = new Map<string, CacheEntry>();
const MAX_ENTRIES = 500;

function ttlMs(): number {
  const n = Number(process.env.LLM_CACHE_TTL_MS);
  return Number.isFinite(n) && n >= 0 ? n : 300_000;
}

export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((x) => stableStringify(x)).join(',')}]`;
  }
  const o = value as Record<string, unknown>;
  const keys = Object.keys(o).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(o[k])}`).join(',')}}`;
}

export function llmCacheKey(operation: string, payload: unknown): string {
  const h = createHash('sha256').update(stableStringify(payload)).digest('hex');
  return `${operation}:${h}`;
}

export function llmCacheGet(
  operation: string,
  payload: unknown
): Nullable<string> {
  const key = llmCacheKey(operation, payload);
  const e = store.get(key);
  if (!e) return null;
  if (Date.now() > e.expiresAt) {
    store.delete(key);
    return null;
  }
  return e.value;
}

export function llmCacheSet(
  operation: string,
  payload: unknown,
  value: string,
  ttl = ttlMs()
): void {
  if (ttl <= 0) return;
  while (store.size >= MAX_ENTRIES) {
    const first = store.keys().next().value as Maybe<string>;
    if (first) store.delete(first);
    else break;
  }
  const key = llmCacheKey(operation, payload);
  store.set(key, { value, expiresAt: Date.now() + ttl });
}

export function llmCacheClear(): void {
  store.clear();
}
