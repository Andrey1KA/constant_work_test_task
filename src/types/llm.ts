import type { Priority } from '@/types/priority';
import type { Nullable } from '@/types/utility';

export type ChatRoleUser = 'user';
export type ChatRoleAssistant = 'assistant';

export type ChatMessageRole = ChatRoleUser | ChatRoleAssistant;

export type ChatTurn = {
  role: ChatMessageRole;
  content: string;
};

export type LlmTaskTitleBody = {
  title: string;
  description?: Nullable<string>;
};

export type LlmSuggestPriorityRequestBody = LlmTaskTitleBody & {
  dueDate?: Nullable<string>;
};

export type LlmCategoryResponseBody = {
  category: string;
  reasoning?: string;
};

export type LlmDecomposeResponseBody = {
  subtasks: string[];
};

export type LlmPriorityResponseBody = {
  priority: Priority;
  reasoning?: string;
};

export type LlmPrismaTaskRow = {
  title: string;
  status: string;
  priority: string;
  dueDate: Nullable<Date>;
  description: Nullable<string>;
};
