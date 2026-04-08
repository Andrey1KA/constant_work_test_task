import type { Task } from '@/types/task';
import type { Nullable } from '@/types/utility';

export type CategorySuggestion = {
  category: string;
  reasoning?: string;
};

export type CategorySuggestModalProps = {
  open: boolean;
  loading: boolean;
  task: Nullable<Task>;
  suggestion: Nullable<CategorySuggestion>;
  onCancel: () => void;
  onAccept: () => void;
  onReject: () => void;
};
