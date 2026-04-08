import type { Dayjs } from 'dayjs';
import type { Priority, TaskStatus } from '@/types/task';
import type { Nullable, Optional } from '@/types/utility';

export type TaskFormDueDate = Optional<Nullable<Dayjs>>;

/** Значения формы создания/редактирования задачи (Ant Design Form). */
export interface TaskFormValues {
  title: string;
  description?: string;
  priority: Priority;
  status: TaskStatus;
  dueDate?: TaskFormDueDate;
  category?: string;
}
