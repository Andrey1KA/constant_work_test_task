import { z } from 'zod';
import type { Task as DbTask } from '@prisma/client';
import type { Task } from '@/types/task';
import { ApiError } from '@/lib/ApiError';
import {
  taskRepository,
  type TaskListQuery,
} from '@/lib/repositories/taskRepository';

const prioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH']);
const statusSchema = z.enum(['PENDING', 'IN_PROGRESS', 'DONE']);

const createBodySchema = z.object({
  title: z.string().min(1, 'title required').max(500),
  description: z.string().max(10000).optional().nullable(),
  priority: prioritySchema,
  status: statusSchema.default('PENDING'),
  dueDate: z.string().datetime().optional().nullable(),
  category: z.string().max(200).optional().nullable(),
});

const updateBodySchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(10000).optional().nullable(),
  priority: prioritySchema.optional(),
  status: statusSchema.optional(),
  dueDate: z.string().datetime().optional().nullable(),
  category: z.string().max(200).optional().nullable(),
});

const sortFieldSchema = z.enum([
  'dueDate',
  'createdAt',
  'priority',
  'status',
  'title',
]);

const listQuerySchema = z.object({
  status: statusSchema.optional(),
  priority: prioritySchema.optional(),
  q: z.string().optional(),
  dueFrom: z.string().optional(),
  dueTo: z.string().optional(),
  overdue: z
    .string()
    .optional()
    .transform((s) => s === 'true'),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  sortBy: sortFieldSchema.optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export function parseListQuery(raw: Record<string, unknown>): TaskListQuery {
  const parsed = listQuerySchema.safeParse(raw);
  if (!parsed.success) {
    throw new ApiError(
      400,
      'VALIDATION_ERROR',
      'Invalid query parameters',
      parsed.error.flatten()
    );
  }
  const v = parsed.data;
  return {
    status: v.status,
    priority: v.priority,
    search: v.q,
    dueFrom: v.dueFrom,
    dueTo: v.dueTo,
    overdue: Boolean(v.overdue),
    page: v.page ?? 1,
    pageSize: v.pageSize ?? 20,
    sortBy: v.sortBy,
    sortOrder: v.sortOrder,
  };
}

function serializeTask(row: DbTask): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    priority: row.priority,
    status: row.status,
    dueDate: row.dueDate ? row.dueDate.toISOString() : null,
    category: row.category,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export type TaskListResult = {
  data: Task[];
  total: number;
  page: number;
  pageSize: number;
};

export const taskService = {
  async list(rawQuery: Record<string, unknown>): Promise<TaskListResult> {
    const q = parseListQuery(rawQuery);
    const { rows, total } = await taskRepository.list(q);
    return {
      data: rows.map(serializeTask),
      total,
      page: q.page,
      pageSize: q.pageSize,
    };
  },

  async get(id: string) {
    const row = await taskRepository.getById(id);
    if (!row) throw new ApiError(404, 'NOT_FOUND', 'Task not found');
    return serializeTask(row);
  },

  async create(body: unknown) {
    const data = createBodySchema.parse(body);
    const row = await taskRepository.create({
      title: data.title.trim(),
      description: data.description?.trim() || null,
      priority: data.priority,
      status: data.status,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      category: data.category?.trim() || null,
    });
    return serializeTask(row);
  },

  async update(id: string, body: unknown) {
    await this.get(id);
    const data = updateBodySchema.parse(body);
    const row = await taskRepository.update(id, {
      ...(data.title !== undefined ? { title: data.title.trim() } : {}),
      ...(data.description !== undefined
        ? { description: data.description?.trim() || null }
        : {}),
      ...(data.priority !== undefined ? { priority: data.priority } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.dueDate !== undefined
        ? { dueDate: data.dueDate ? new Date(data.dueDate) : null }
        : {}),
      ...(data.category !== undefined
        ? { category: data.category?.trim() || null }
        : {}),
    });
    return serializeTask(row);
  },

  async remove(id: string) {
    await this.get(id);
    await taskRepository.delete(id);
  },
};
