import type { Nullable } from '@/types/utility';
import type { Priority } from '@/types/priority';
import type { TaskListSortOrder } from '@/types/taskListSortOrder';
import type { TaskSortField } from '@/types/taskSortField';
import type { TaskStatus } from '@/types/taskStatus';

export type { Priority } from '@/types/priority';
export type { TaskStatus } from '@/types/taskStatus';
export type { TaskSortField } from '@/types/taskSortField';
export type { TaskListSortOrder } from '@/types/taskListSortOrder';

export interface Task {
  id: string;
  title: string;
  description: Nullable<string>;
  priority: Priority;
  status: TaskStatus;
  dueDate: Nullable<string>;
  category: Nullable<string>;
  createdAt: string;
  updatedAt: string;
}

export interface TaskPayload {
  title: string;
  description?: Nullable<string>;
  priority: Priority;
  status: TaskStatus;
  dueDate?: Nullable<string>;
  category?: Nullable<string>;
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: Priority;
  q?: string;
  dueFrom?: string;
  dueTo?: string;
  overdue?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: TaskSortField;
  sortOrder?: TaskListSortOrder;
}

export type TaskListResponse = {
  data: Task[];
  total: number;
  page: number;
  pageSize: number;
};
