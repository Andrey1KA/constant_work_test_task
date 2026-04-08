import type { Dayjs } from 'dayjs';
import type { Priority, TaskStatus } from '@/types/task';
import type { Maybe, Nullable } from '@/types/utility';

export type TaskFormDueDate = Maybe<Nullable<Dayjs>>;

export type TaskFormValues = {
  title: string;
  description?: string;
  priority: Priority;
  status: TaskStatus;
  dueDate?: TaskFormDueDate;
  category?: string;
};
