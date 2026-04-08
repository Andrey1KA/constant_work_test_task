export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: Priority;
  status: TaskStatus;
  dueDate: string | null;
  category: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskPayload {
  title: string;
  description?: string | null;
  priority: Priority;
  status: TaskStatus;
  dueDate?: string | null;
  category?: string | null;
}

export type TaskSortField =
  | 'dueDate'
  | 'createdAt'
  | 'priority'
  | 'status'
  | 'title';

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
  sortOrder?: 'asc' | 'desc';
}

export type TaskListResponse = {
  data: Task[];
  total: number;
  page: number;
  pageSize: number;
};
