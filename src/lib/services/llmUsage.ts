import type { Nullable } from '@/types';

export type LlmUsageSlice = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
};

const totals = {
  promptTokens: 0,
  completionTokens: 0,
  totalTokens: 0,
  callsWithUsage: 0,
};

export function recordLlmUsage(usage?: Nullable<LlmUsageSlice>): void {
  if (!usage) return;
  const p = usage.prompt_tokens ?? 0;
  const c = usage.completion_tokens ?? 0;
  const t = usage.total_tokens ?? p + c;
  totals.promptTokens += p;
  totals.completionTokens += c;
  totals.totalTokens += t;
  totals.callsWithUsage += 1;

  if (process.env.LLM_LOG_USAGE === '1') {
    console.info('[LLM usage]', { prompt_tokens: p, completion_tokens: c, total_tokens: t });
  }
}

export function getLlmUsageTotals() {
  return { ...totals };
}
