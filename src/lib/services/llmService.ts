import OpenAI from 'openai';
import { z } from 'zod';
import { ApiError } from '@/lib/ApiError';
import { prisma } from '@/lib/prisma';
import type {
  ChatTurn,
  LlmPrismaTaskRow,
  LlmSuggestPriorityRequestBody,
  LlmTaskTitleBody,
} from '@/types/llm';
import type { Nullable } from '@/types/utility';
import {
  llmCacheGet,
  llmCacheKey,
  llmCacheSet,
} from '@/lib/services/llmCache';
import { runLlmDeduped } from '@/lib/services/llmInFlight';
import { recordLlmUsage } from '@/lib/services/llmUsage';

const categoryResponseSchema = z.object({
  category: z.string().min(1).max(120),
  reasoning: z.string().max(2000).optional(),
});

const decomposeResponseSchema = z.object({
  subtasks: z.array(z.string().min(1).max(500)).min(1).max(20),
});

const priorityResponseSchema = z.object({
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  reasoning: z.string().max(2000).optional(),
});

function getClient(): Nullable<OpenAI> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

function getModel(): string {
  return process.env.OPENAI_MODEL || 'gpt-4o-mini';
}

const FEW_SHOT_CATEGORY: ChatTurn[] = [
  {
    role: 'user',
    content:
      '{"title":"Квартальный отчёт по продажам","description":"Собрать данные из CRM и свести в таблицу"}',
  },
  {
    role: 'assistant',
    content:
      '{"category":"Работа / аналитика","reasoning":"Содержание про отчётность и данные в компании."}',
  },
  {
    role: 'user',
    content: '{"title":"Записаться к стоматологу","description":""}',
  },
  {
    role: 'assistant',
    content: '{"category":"Здоровье","reasoning":"Личная медицинская услуга."}',
  },
];

const FEW_SHOT_DECOMPOSE: ChatTurn[] = [
  {
    role: 'user',
    content:
      '{"title":"Запустить промо-лендинг","description":"Нужны тексты, макет, вёрстка и публикация"}',
  },
  {
    role: 'assistant',
    content:
      '{"subtasks":["Согласовать структуру страниц и УТП","Написать тексты и подобрать визуал","Сверстать адаптивно и проверить формы","Задеплоить и настроить аналитику"]}',
  },
];

const FEW_SHOT_PRIORITY: ChatTurn[] = [
  {
    role: 'user',
    content:
      '{"title":"Подписать договор с контрагентом","description":"Юридически обязательный документ","dueDate":"2025-06-01T00:00:00.000Z"}',
  },
  {
    role: 'assistant',
    content:
      '{"priority":"HIGH","reasoning":"Фиксированный внешний дедлайн и юридическая значимость."}',
  },
  {
    role: 'user',
    content:
      '{"title":"Почитать статью про TypeScript","description":"Для самообразования","dueDate":null}',
  },
  {
    role: 'assistant',
    content:
      '{"priority":"LOW","reasoning":"Нет срока, необязательная задача обучения."}',
  },
];

const FEW_SHOT_SUMMARY_MARKDOWN: ChatTurn[] = [
  {
    role: 'user',
    content:
      '{"tasks":[{"title":"Отчёт","status":"DONE","priority":"LOW","dueDate":null,"description":""},{"title":"Релиз","status":"PENDING","priority":"HIGH","dueDate":"2099-02-01T00:00:00.000Z","description":""}]}',
  },
  {
    role: 'assistant',
    content:
      '## Сводка нагрузки\n\n**Просроченные:** нет.\n\n**Ближайшие 7 дней:** задача «Релиз» (высокий приоритет).\n\n**По приоритетам:** HIGH — 1, LOW — 1.\n\n**По статусам:** готово — 1, ожидает — 1.\n\n**Совет:** закрепите время на «Релиз» из-за HIGH.',
  },
];

const FEW_SHOT_SUMMARY_JSON: ChatTurn[] = [
  {
    role: 'user',
    content:
      '{"tasks":[{"title":"A","status":"PENDING","priority":"MEDIUM","dueDate":null,"description":""}]}',
  },
  {
    role: 'assistant',
    content:
      '{"summary":"## Сводка\\n\\n**Просроченные:** нет.\\n**Ближайшие сроки:** нет жёстких дат.\\n**Приоритеты:** MEDIUM — 1.\\n**Статусы:** ожидает — 1.\\n**Совет:** уточните срок для задачи A."}',
  },
];

async function completeJson(
  system: string,
  user: string,
  fewShot: ChatTurn[] = []
): Promise<string> {
  const client = getClient();
  const model = getModel();

  if (!client) {
    return mockJsonResponse(system, user);
  }

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: system },
    ...fewShot.map((t) => ({
      role: t.role,
      content: t.content,
    })),
    { role: 'user', content: user },
  ];

  const res = await client.chat.completions.create({
    model,
    temperature: 0.3,
    response_format: { type: 'json_object' },
    messages,
  });

  recordLlmUsage(res.usage);

  const text = res.choices[0]?.message?.content;
  if (!text) {
    throw new ApiError(502, 'LLM_ERROR', 'Empty LLM response');
  }
  return text;
}

function mockJsonResponse(system: string, user: string): string {
  const payload = JSON.parse(
    JSON.stringify({
      title: '',
      description: '',
      dueDate: null as Nullable<string>,
    })
  );
  try {
    const u = JSON.parse(user);
    if (typeof u.title === 'string') payload.title = u.title;
    if (typeof u.description === 'string') payload.description = u.description;
    if (u.dueDate) payload.dueDate = u.dueDate;
  } catch {}

  if (system.includes('category')) {
    const tag =
      payload.title?.split(/\s+/).slice(0, 2).join(' ').slice(0, 40) ||
      'Общее';
    return JSON.stringify({
      category: `Демо: ${tag}`,
      reasoning:
        'Режим без API-ключа: задайте OPENAI_API_KEY в .env в корне проекта.',
    });
  }
  if (system.includes('subtasks')) {
    const base = payload.title || 'Задача';
    return JSON.stringify({
      subtasks: [
        `Демо: уточнить требования — ${base}`,
        `Демо: выполнить основную часть — ${base}`,
        `Демо: проверить результат — ${base}`,
      ],
    });
  }
  if (system.includes('prioritization')) {
    return JSON.stringify({
      priority: payload.dueDate ? 'HIGH' : 'MEDIUM',
      reasoning:
        'Демо-приоритет: при наличии срока выше, без ключа — эвристика.',
    });
  }
  if (system.includes('workload coach')) {
    return JSON.stringify({
      summary:
        '**Демо-режим** (нет OPENAI_API_KEY). В реальном режиме здесь будет: просроченные задачи, ближайшие дедлайны, распределение по приоритетам и статусам.\n\nЗадайте ключ в `.env` и перезапустите `npm run dev`.',
    });
  }
  return JSON.stringify({
    summary: 'Демо: не удалось классифицировать запрос LLM.',
  });
}

const SYSTEM_CATEGORY = `You are a task taxonomy assistant. Given a task title and description, propose ONE short category or tag (2-4 words, Russian or English consistent with input).
Respond ONLY with JSON: {"category": string, "reasoning"?: string}`;

const SYSTEM_DECOMPOSE = `You are a planning assistant. Split the task into 3-7 concrete subtasks (imperative, short). Respond ONLY with JSON: {"subtasks": string[]}`;

const SYSTEM_PRIORITY = `You are a prioritization assistant. Suggest priority LOW, MEDIUM, or HIGH from title, description, and optional due date (ISO).
Respond ONLY with JSON: {"priority": "LOW"|"MEDIUM"|"HIGH", "reasoning"?: string}`;

const SYSTEM_SUMMARY = `You are a workload coach. Input: JSON { tasks: [...] } with fields title, status (PENDING|IN_PROGRESS|DONE), priority (LOW|MEDIUM|HIGH), dueDate (ISO or null), description.

Write a concise Russian summary in markdown. You MUST explicitly cover:
1) Просроченные задачи (dueDate before today, status not DONE) — перечислить или сказать что нет.
2) Ближайшие сроки (следующие 7 дней).
3) Распределение по приоритетам (сколько HIGH/MEDIUM/LOW).
4) Распределение по статусам (сколько в каждом статусе).
5) 1–2 практических совета по разгрузке.

Respond ONLY with JSON: {"summary": string}.`;

const SYSTEM_SUMMARY_MARKDOWN = `You are a workload coach. You receive JSON { tasks: [...] } with fields title, status (PENDING|IN_PROGRESS|DONE), priority (LOW|MEDIUM|HIGH), dueDate (ISO or null), description.

Write a concise Russian summary ONLY as markdown (no JSON wrapper). You MUST explicitly cover:
1) Просроченные задачи (dueDate before today, status not DONE) — перечислить или сказать что нет.
2) Ближайшие сроки (следующие 7 дней).
3) Распределение по приоритетам (сколько HIGH/MEDIUM/LOW).
4) Распределение по статусам (сколько в каждом статусе).
5) 1–2 практических совета по разгрузке.

Use headings and bullet lists where helpful.`;

async function buildWorkloadUserJson(): Promise<{
  userJson: string;
  cachePayload: ReturnType<typeof mapTasksForLlm>;
}> {
  const tasks = await prisma.task.findMany({
    orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
    take: 200,
  });
  const payload = mapTasksForLlm(tasks);
  return { userJson: JSON.stringify({ tasks: payload }), cachePayload: payload };
}

function mapTasksForLlm(tasks: LlmPrismaTaskRow[]) {
  return tasks.map((t) => ({
    title: t.title,
    status: t.status,
    priority: t.priority,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    description: (t.description ?? '').slice(0, 400),
  }));
}

const DEMO_SUMMARY_MD =
  '**Демо-режим** (нет OPENAI_API_KEY). В реальном режиме здесь будет потоковая сводка: просроченные задачи, ближайшие дедлайны, распределение по приоритетам и статусам.\n\nЗадайте ключ в `.env` и перезапустите `npm run dev`.';

export const llmService = {
  async suggestCategory(input: LlmTaskTitleBody) {
    const hit = llmCacheGet('suggestCategory', input);
    if (hit) {
      const v = categoryResponseSchema.safeParse(JSON.parse(hit));
      if (v.success) return v.data;
    }
    const dedupKey = llmCacheKey('suggestCategory', input);
    return runLlmDeduped(dedupKey, async () => {
      const user = JSON.stringify({
        title: input.title,
        description: input.description ?? '',
      });
      const raw = await completeJson(SYSTEM_CATEGORY, user, FEW_SHOT_CATEGORY);
      llmCacheSet('suggestCategory', input, raw);
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        throw new ApiError(502, 'LLM_ERROR', 'LLM returned non-JSON');
      }
      const v = categoryResponseSchema.safeParse(parsed);
      if (!v.success) {
        throw new ApiError(
          502,
          'LLM_ERROR',
          'Invalid LLM schema for category',
          v.error.flatten()
        );
      }
      return v.data;
    });
  },

  async decompose(input: LlmTaskTitleBody) {
    const hit = llmCacheGet('decompose', input);
    if (hit) {
      const v = decomposeResponseSchema.safeParse(JSON.parse(hit));
      if (v.success) return v.data;
    }
    const dedupKey = llmCacheKey('decompose', input);
    return runLlmDeduped(dedupKey, async () => {
      const user = JSON.stringify({
        title: input.title,
        description: input.description ?? '',
      });
      const raw = await completeJson(SYSTEM_DECOMPOSE, user, FEW_SHOT_DECOMPOSE);
      llmCacheSet('decompose', input, raw);
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        throw new ApiError(502, 'LLM_ERROR', 'LLM returned non-JSON');
      }
      const v = decomposeResponseSchema.safeParse(parsed);
      if (!v.success) {
        throw new ApiError(
          502,
          'LLM_ERROR',
          'Invalid LLM schema for decompose',
          v.error.flatten()
        );
      }
      return v.data;
    });
  },

  async suggestPriority(input: LlmSuggestPriorityRequestBody) {
    const hit = llmCacheGet('suggestPriority', input);
    if (hit) {
      const v = priorityResponseSchema.safeParse(JSON.parse(hit));
      if (v.success) return v.data;
    }
    const dedupKey = llmCacheKey('suggestPriority', input);
    return runLlmDeduped(dedupKey, async () => {
      const user = JSON.stringify({
        title: input.title,
        description: input.description ?? '',
        dueDate: input.dueDate ?? null,
      });
      const raw = await completeJson(SYSTEM_PRIORITY, user, FEW_SHOT_PRIORITY);
      llmCacheSet('suggestPriority', input, raw);
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        throw new ApiError(502, 'LLM_ERROR', 'LLM returned non-JSON');
      }
      const v = priorityResponseSchema.safeParse(parsed);
      if (!v.success) {
        throw new ApiError(
          502,
          'LLM_ERROR',
          'Invalid LLM schema for priority',
          v.error.flatten()
        );
      }
      return v.data;
    });
  },

  async workloadSummary() {
    const { userJson, cachePayload } = await buildWorkloadUserJson();
    const hit = llmCacheGet('workloadSummary', cachePayload);
    if (hit) {
      const v = z.object({ summary: z.string().min(1) }).safeParse(JSON.parse(hit));
      if (v.success) return v.data;
    }
    const dedupKey = llmCacheKey('workloadSummary', cachePayload);
    return runLlmDeduped(dedupKey, async () => {
      const raw = await completeJson(
        SYSTEM_SUMMARY,
        userJson,
        FEW_SHOT_SUMMARY_JSON
      );
      llmCacheSet('workloadSummary', cachePayload, raw);
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        throw new ApiError(502, 'LLM_ERROR', 'LLM returned non-JSON');
      }
      const v = z.object({ summary: z.string().min(1) }).safeParse(parsed);
      if (!v.success) {
        throw new ApiError(
          502,
          'LLM_ERROR',
          'Invalid LLM schema for summary',
          v.error.flatten()
        );
      }
      return v.data;
    });
  },

  async *workloadSummaryStream(): AsyncGenerator<string, void, undefined> {
    const { userJson, cachePayload } = await buildWorkloadUserJson();
    const cachedMd = llmCacheGet('workloadSummaryStream', cachePayload);
    if (cachedMd) {
      yield cachedMd;
      return;
    }

    const client = getClient();
    if (!client) {
      llmCacheSet('workloadSummaryStream', cachePayload, DEMO_SUMMARY_MD);
      yield DEMO_SUMMARY_MD;
      return;
    }

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_SUMMARY_MARKDOWN },
      ...FEW_SHOT_SUMMARY_MARKDOWN.map((t) => ({
        role: t.role,
        content: t.content,
      })),
      { role: 'user', content: userJson },
    ];

    const stream = await client.chat.completions.create({
      model: getModel(),
      stream: true,
      temperature: 0.35,
      messages,
      stream_options: { include_usage: true },
    });

    let full = '';
    for await (const part of stream) {
      if (part.usage) recordLlmUsage(part.usage);
      const t = part.choices[0]?.delta?.content ?? '';
      if (t) {
        full += t;
        yield t;
      }
    }
    if (full.trim()) {
      llmCacheSet('workloadSummaryStream', cachePayload, full);
    }
  },
};
