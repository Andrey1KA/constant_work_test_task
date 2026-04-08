import type { ChangeEvent } from 'react';
import type { Task } from '@/types/task';
import type { Nullable } from '@/types/utility';

export type DecomposeSubtasksModalProps = {
  open: boolean;
  loading: boolean;
  task: Nullable<Task>;
  items: string[];
  getLineChangeHandler: (
    index: number
  ) => (e: ChangeEvent<HTMLInputElement>) => void;
  onCancel: () => void;
  onCreate: () => void;
};
