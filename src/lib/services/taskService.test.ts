import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ZodError } from 'zod';
import {
  parseListQuery,
  taskService,
} from '@/lib/services/taskService';
import type { Task as PrismaTask } from '@prisma/client';
import type { TaskListResponse } from '@/types/task';
import { ApiError } from '@/lib/ApiError';
import { taskRepository } from '@/lib/repositories/taskRepository';

vi.mock('@/lib/repositories/taskRepository', () => ({
  taskRepository: {
    list: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockRepo = vi.mocked(taskRepository);

function sampleRow(overrides: Partial<PrismaTask> = {}): PrismaTask {
  const base: PrismaTask = {
    id: 't-1',
    title: 'Task',
    description: null,
    priority: 'MEDIUM',
    status: 'PENDING',
    dueDate: null,
    category: null,
    createdAt: new Date('2025-01-01T10:00:00.000Z'),
    updatedAt: new Date('2025-01-02T10:00:00.000Z'),
  };
  return { ...base, ...overrides };
}

describe('parseListQuery', () => {
  it('combines status, priority, search, overdue into TaskListQuery', () => {
    const q = parseListQuery({
      status: 'DONE',
      priority: 'HIGH',
      q: '  find me  ',
      overdue: 'true',
    });
    expect(q).toEqual({
      status: 'DONE',
      priority: 'HIGH',
      search: '  find me  ',
      dueFrom: undefined,
      dueTo: undefined,
      overdue: true,
      page: 1,
      pageSize: 20,
      sortBy: undefined,
      sortOrder: undefined,
    });
  });

  it('throws ApiError on invalid status', () => {
    expect(() =>
      parseListQuery({ status: 'INVALID' })
    ).toThrowError(ApiError);
    try {
      parseListQuery({ status: 'INVALID' });
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      expect((e as ApiError).code).toBe('VALIDATION_ERROR');
    }
  });
});

describe('taskService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('list maps repository rows to API shape with ISO dates', async () => {
    mockRepo.list.mockResolvedValue({
      rows: [
        sampleRow({
          id: 'a',
          title: 'A',
          dueDate: new Date('2025-06-15T12:00:00.000Z'),
        }),
      ],
      total: 1,
    });

    const result: TaskListResponse = await taskService.list({
      status: 'PENDING',
      q: 'A',
    });

    expect(mockRepo.list).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'PENDING',
        search: 'A',
        page: 1,
        pageSize: 20,
      })
    );
    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
    expect(result.data[0]).toMatchObject({
      id: 'a',
      title: 'A',
      dueDate: '2025-06-15T12:00:00.000Z',
    });
  });

  it('get throws NOT_FOUND when missing', async () => {
    mockRepo.getById.mockResolvedValue(null);
    await expect(taskService.get('missing')).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('create trims title/description and passes to repository', async () => {
    mockRepo.create.mockResolvedValue(
      sampleRow({
        title: 'Trimmed',
        description: 'X',
      })
    );

    await taskService.create({
      title: '  Trimmed  ',
      description: '  X  ',
      priority: 'LOW',
      status: 'IN_PROGRESS',
    });

    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Trimmed',
        description: 'X',
        priority: 'LOW',
        status: 'IN_PROGRESS',
      })
    );
  });

  it('create throws ZodError on invalid body', async () => {
    await expect(
      taskService.create({ title: '', priority: 'LOW' })
    ).rejects.toBeInstanceOf(ZodError);
  });

  it('update loads task then applies partial patch', async () => {
    mockRepo.getById.mockResolvedValue(sampleRow({ id: 'x' }));
    mockRepo.update.mockResolvedValue(
      sampleRow({ id: 'x', title: 'New', status: 'DONE' })
    );

    const result = await taskService.update('x', { title: ' New ', status: 'DONE' });

    expect(mockRepo.getById).toHaveBeenCalledWith('x');
    expect(mockRepo.update).toHaveBeenCalledWith(
      'x',
      expect.objectContaining({ title: 'New', status: 'DONE' })
    );
    expect(result.title).toBe('New');
    expect(result.status).toBe('DONE');
  });

  it('remove calls delete after get', async () => {
    mockRepo.getById.mockResolvedValue(sampleRow({ id: 'd' }));
    mockRepo.delete.mockResolvedValue(sampleRow() as never);

    await taskService.remove('d');

    expect(mockRepo.delete).toHaveBeenCalledWith('d');
  });
});
