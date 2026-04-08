import type { TaskPayload } from '@/types/task';

export type TaskUpdateParams = {
  id: string;
  patch: Partial<TaskPayload>;
};
