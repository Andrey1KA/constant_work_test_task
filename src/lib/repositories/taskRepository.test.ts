import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    task: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import { taskRepository } from '@/lib/repositories/taskRepository';
import { prisma } from '@/lib/prisma';

const baseList = {
  page: 1,
  pageSize: 20,
};

describe('taskRepository.list', () => {
  beforeEach(() => {
    vi.mocked(prisma.task.findMany).mockClear();
    vi.mocked(prisma.task.count).mockClear();
    vi.mocked(prisma.task.findMany).mockResolvedValue([]);
    vi.mocked(prisma.task.count).mockResolvedValue(0);
  });

  it('комбинирует статус, приоритет и поиск (OR по title/description)', async () => {
    vi.mocked(prisma.task.count).mockResolvedValue(2);
    await taskRepository.list({
      ...baseList,
      status: 'PENDING',
      priority: 'HIGH',
      search: 'отчёт',
      overdue: false,
    });

    const where = {
      status: 'PENDING',
      priority: 'HIGH',
      OR: [
        { title: { contains: 'отчёт' } },
        { description: { contains: 'отчёт' } },
      ],
    };

    expect(prisma.task.count).toHaveBeenCalledWith({ where });
    expect(prisma.task.findMany).toHaveBeenCalledWith({
      where,
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
      skip: 0,
      take: 20,
    });
  });

  it('режим просроченных задаёт dueDate и исключает DONE', async () => {
    await taskRepository.list({ ...baseList, overdue: true, search: 'a' });

    const call = vi.mocked(prisma.task.findMany).mock.calls[0];
    expect(call).toBeDefined();
    const arg = call![0];
    expect(arg?.where).toMatchObject({
      OR: [
        { title: { contains: 'a' } },
        { description: { contains: 'a' } },
      ],
      NOT: { status: 'DONE' },
    });
    expect(arg?.where?.dueDate).toEqual(
      expect.objectContaining({ lt: expect.any(Date) })
    );
    expect(arg?.skip).toBe(0);
    expect(arg?.take).toBe(20);
  });

  it('диапазон сроков применяется если не overdue', async () => {
    await taskRepository.list({
      ...baseList,
      overdue: false,
      dueFrom: '2025-01-01T00:00:00.000Z',
      dueTo: '2025-12-31T23:59:59.999Z',
    });

    const where = {
      dueDate: {
        gte: new Date('2025-01-01T00:00:00.000Z'),
        lte: new Date('2025-12-31T23:59:59.999Z'),
      },
    };

    expect(prisma.task.count).toHaveBeenCalledWith({ where });
    expect(prisma.task.findMany).toHaveBeenCalledWith({
      where,
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
      skip: 0,
      take: 20,
    });
  });

  it('сортировка по полю из запроса', async () => {
    await taskRepository.list({
      ...baseList,
      page: 2,
      pageSize: 10,
      sortBy: 'title',
      sortOrder: 'desc',
    });

    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ title: 'desc' }],
        skip: 10,
        take: 10,
      })
    );
  });
});
