import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    task: {
      findMany: vi.fn(),
    },
  },
}));

import { llmService } from '@/lib/services/llmService';
import { prisma } from '@/lib/prisma';
import { llmCacheClear } from '@/lib/services/llmCache';
import { resetLlmInFlightForTests } from '@/lib/services/llmInFlight';

describe('llmService (demo / без OPENAI_API_KEY)', () => {
  beforeEach(() => {
    vi.stubEnv('OPENAI_API_KEY', '');
    llmCacheClear();
    resetLlmInFlightForTests();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('suggestCategory возвращает демо-категорию', async () => {
    const r = await llmService.suggestCategory({
      title: 'Подготовить отчёт',
      description: 'Квартальный',
    });
    expect(r.category).toMatch(/Демо/);
    expect(r.reasoning).toBeDefined();
  });

  it('decompose возвращает список подзадач', async () => {
    const r = await llmService.decompose({
      title: 'Большой проект',
      description: null,
    });
    expect(r.subtasks.length).toBeGreaterThanOrEqual(1);
    expect(r.subtasks[0]).toMatch(/Демо/);
  });

  it('suggestPriority возвращает LOW|MEDIUM|HIGH', async () => {
    const r = await llmService.suggestPriority({
      title: 'Urgent',
      description: null,
      dueDate: '2025-12-01T00:00:00.000Z',
    });
    expect(['LOW', 'MEDIUM', 'HIGH']).toContain(r.priority);
  });

  it('workloadSummary читает задачи из БД и возвращает текст сводки', async () => {
    vi.mocked(prisma.task.findMany).mockResolvedValue([
      {
        id: '1',
        title: 'A',
        description: null,
        priority: 'HIGH',
        status: 'PENDING',
        dueDate: null,
        category: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as never);

    const r = await llmService.workloadSummary();
    expect(r.summary.length).toBeGreaterThan(10);
    expect(r.summary).toMatch(/Демо|демо/);
  });

  it('workloadSummaryStream отдаёт демо-текст по частям', async () => {
    vi.mocked(prisma.task.findMany).mockResolvedValue([] as never);

    const parts: string[] = [];
    for await (const chunk of llmService.workloadSummaryStream()) {
      parts.push(chunk);
    }
    const full = parts.join('');
    expect(full.length).toBeGreaterThan(10);
    expect(full).toMatch(/Демо|демо/);
  });
});
