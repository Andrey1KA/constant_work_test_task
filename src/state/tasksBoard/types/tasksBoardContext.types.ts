import type { TableProps } from 'antd';
import type { QueryClient, UseMutationResult } from '@tanstack/react-query';
import type { TaskTableColumnSortOrder } from '@/types/antdTable';
import type { TaskBoardDateRange } from '@/types/dayjsRange';
import type {
  Priority,
  Task,
  TaskFilters,
  TaskListSortOrder,
  TaskPayload,
  TaskSortField,
  TaskStatus,
} from '@/types/task';
import type { TaskUpdateParams } from '@/types/taskMutation';

export type TasksBoardContextValue = {
  tasks: Task[];
  total: number;
  listFilters: TaskFilters;
  isFetching: boolean;
  isError: boolean;
  queryError: unknown;
  refetch: () => void;
  filterStatus?: TaskStatus;
  setFilterStatus: (value?: TaskStatus) => void;
  filterPriority?: Priority;
  setFilterPriority: (value?: Priority) => void;
  appliedSearch: string;
  setAppliedSearch: (value: string) => void;
  dateRange: TaskBoardDateRange;
  setDateRange: (value: TaskBoardDateRange) => void;
  overdueOnly: boolean;
  setOverdueOnly: (value: boolean) => void;
  tablePage: number;
  tablePageSize: number;
  sortBy?: TaskSortField;
  sortOrder?: TaskListSortOrder;
  handleTableChange: TableProps<Task>['onChange'];
  columnSortOrder: (field: TaskSortField) => TaskTableColumnSortOrder;
  createTaskMut: UseMutationResult<Task, unknown, TaskPayload>;
  updateTaskMut: UseMutationResult<Task, unknown, TaskUpdateParams>;
  deleteTaskMut: UseMutationResult<void, unknown, string>;
  queryClient: QueryClient;
};
