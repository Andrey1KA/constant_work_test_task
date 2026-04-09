import type { Dayjs } from 'dayjs';
import type { Priority, TaskStatus } from '@/types/task';
import type { Nullable, Optional } from '@/types/utility';

export type TaskFormDueDate = Optional<Nullable<Dayjs>>;

export interface TaskFormValues {
  title: string;
  description?: string;
  priority: Priority;
  status: TaskStatus;
  dueDate?: TaskFormDueDate;
  category?: string;
}
