import type { UpdateTaskDTO } from '@/types/task';

export interface TaskUpdateParams {
  id: string;
  patch: UpdateTaskDTO;
}
