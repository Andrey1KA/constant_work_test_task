import type { Priority, Task } from '@/types/task';
import type { Nullable } from '@/types/utility';

export type PrioritySuggestModalProps = {
  open: boolean;
  loading: boolean;
  task: Nullable<Task>;
  value: Priority;
  reason: string;
  onValueChange: (value: Priority) => void;
  onCancel: () => void;
  onApply: () => void;
  onReject: () => void;
};
