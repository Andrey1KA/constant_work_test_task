import type { Prisma, Task } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { Priority } from '@/types/priority';
import type { TaskListSortOrder } from '@/types/taskListSortOrder';
import type { TaskSortField } from '@/types/taskSortField';
import type { TaskStatus } from '@/types/taskStatus';

export type { TaskSortField } from '@/types/taskSortField';

export type TaskListQuery = {
  status?: TaskStatus;
  priority?: Priority;
  search?: string;
  dueFrom?: string;
  dueTo?: string;
  overdue?: boolean;
  page: number;
  pageSize: number;
  sortBy?: TaskSortField;
  sortOrder?: TaskListSortOrder;
};

function startOfTodayUtc(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function buildOrderBy(
  q: TaskListQuery
): Prisma.TaskOrderByWithRelationInput[] {
  if (q.sortBy && q.sortOrder) {
    return [{ [q.sortBy]: q.sortOrder }];
  }
  return [{ dueDate: 'asc' }, { createdAt: 'desc' }];
}

export const taskRepository = {
  async list(q: TaskListQuery): Promise<{ rows: Task[]; total: number }> {
    const where: Prisma.TaskWhereInput = {};

    if (q.status) where.status = q.status;
    if (q.priority) where.priority = q.priority;

    if (q.search?.trim()) {
      const s = q.search.trim();
      where.OR = [
        { title: { contains: s } },
        { description: { contains: s } },
      ];
    }

    if (q.overdue) {
      where.dueDate = { lt: startOfTodayUtc() };
      where.NOT = { status: 'DONE' };
    } else if (q.dueFrom || q.dueTo) {
      const range: Prisma.DateTimeFilter = {};
      if (q.dueFrom) range.gte = new Date(q.dueFrom);
      if (q.dueTo) range.lte = new Date(q.dueTo);
      where.dueDate = range;
    }

    const orderBy = buildOrderBy(q);
    const skip = (q.page - 1) * q.pageSize;

    const [total, rows] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.findMany({
        where,
        orderBy,
        skip,
        take: q.pageSize,
      }),
    ]);

    return { rows, total };
  },

  async getById(id: string) {
    return prisma.task.findUnique({ where: { id } });
  },

  async create(data: Prisma.TaskCreateInput) {
    return prisma.task.create({ data });
  },

  async update(id: string, data: Prisma.TaskUpdateInput) {
    return prisma.task.update({ where: { id }, data });
  },

  async delete(id: string) {
    return prisma.task.delete({ where: { id } });
  },
};
