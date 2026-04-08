import type { FormInstance } from 'antd/es/form';
import type { TaskFormValues } from '@/lib/taskBoard/taskFormTypes';
import type { Task } from '@/types/task';
import type { Awaitable, Nullable } from '@/types/utility';

export type TaskFormModalProps = {
  open: boolean;
  editing: Nullable<Task>;
  form: FormInstance<TaskFormValues>;
  onCancel: () => void;
  onFinish: (values: TaskFormValues) => Awaitable<void>;
  isSubmitting: boolean;
};
