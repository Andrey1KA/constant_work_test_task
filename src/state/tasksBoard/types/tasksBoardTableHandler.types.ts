import type {
  FilterValue,
  SorterResult,
} from 'antd/es/table/interface';
import type { Task } from '@/types/task';
import type { Nullable } from '@/types/utility';

export type TaskListTableSorterSingle = SorterResult<Task>;
export type TaskListTableSorterArray = SorterResult<Task>[];

export type TaskListTableSorter =
  | TaskListTableSorterSingle
  | TaskListTableSorterArray;

export type TaskListTableFiltersRecord = Record<string, Nullable<FilterValue>>;
