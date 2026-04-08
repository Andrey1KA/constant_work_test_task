import type { Priority } from '@/types/priority';
import type { TaskListSortOrder } from '@/types/taskListSortOrder';
import type { TaskSortField } from '@/types/taskSortField';
import type { TaskStatus } from '@/types/taskStatus';
import type { Maybe } from '@/types/utility';

export type TaskStatusFilterValue = Maybe<TaskStatus>;
export type PriorityFilterValue = Maybe<Priority>;
export type TaskSortByValue = Maybe<TaskSortField>;
export type TaskSortOrderValue = Maybe<TaskListSortOrder>;
