'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import {
  useQueryClient,
  type QueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import type { TableProps } from 'antd';
import type { FilterValue, SorterResult } from 'antd/es/table/interface';
import type {
  CreateTaskDTO,
  Nullable,
  Optional,
  Priority,
  Task,
  TaskBoardDateRange,
  TaskTableColumnSortOrder,
  TaskFilters,
  TaskListSortOrder,
  TaskSortField,
  TaskStatus,
  TaskUpdateParams,
} from '@/types';
import { useTasksBoardFilters } from '@/state/tasksBoard/useTasksBoardFilters';
import { useTasksBoardListQuery } from '@/state/tasksBoard/useTasksBoardListQuery';
import { useTasksBoardMutations } from '@/state/tasksBoard/useTasksBoardMutations';

export type TaskStatusFilterValue = Optional<TaskStatus>;
export type PriorityFilterValue = Optional<Priority>;
export type TaskSortByValue = Optional<TaskSortField>;
export type TaskSortOrderValue = Optional<TaskListSortOrder>;

export type TaskListTableSorterSingle = SorterResult<Task>;
export type TaskListTableSorterArray = SorterResult<Task>[];
export type TaskListTableSorter =
  | TaskListTableSorterSingle
  | TaskListTableSorterArray;

export type TaskListTableFiltersRecord = Record<string, Nullable<FilterValue>>;

export interface TasksBoardContextValue {
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
  createTaskMut: UseMutationResult<Task, unknown, CreateTaskDTO>;
  updateTaskMut: UseMutationResult<Task, unknown, TaskUpdateParams>;
  deleteTaskMut: UseMutationResult<void, unknown, string>;
  queryClient: QueryClient;
}

const EMPTY_TASKS: Task[] = [];

const TasksBoardContext = createContext<Nullable<TasksBoardContextValue>>(null);

export function TasksBoardProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const {
    listFilters,
    filterStatus,
    setFilterStatus,
    filterPriority,
    setFilterPriority,
    appliedSearch,
    setAppliedSearch,
    dateRange,
    setDateRange,
    overdueOnly,
    setOverdueOnly,
    tablePage,
    tablePageSize,
    sortBy,
    sortOrder,
    handleTableChange,
    columnSortOrder,
  } = useTasksBoardFilters();

  const {
    data: listPayload,
    isFetching,
    isError,
    error: queryError,
    refetch,
  } = useTasksBoardListQuery(listFilters);

  const tasks = listPayload?.data ?? EMPTY_TASKS;
  const total = listPayload?.total ?? 0;

  const { createTaskMut, updateTaskMut, deleteTaskMut } =
    useTasksBoardMutations(queryClient);

  const value = useMemo<TasksBoardContextValue>(
    () => ({
      tasks,
      total,
      listFilters,
      isFetching,
      isError,
      queryError,
      refetch,
      filterStatus,
      setFilterStatus,
      filterPriority,
      setFilterPriority,
      appliedSearch,
      setAppliedSearch,
      dateRange,
      setDateRange,
      overdueOnly,
      setOverdueOnly,
      tablePage,
      tablePageSize,
      sortBy,
      sortOrder,
      handleTableChange,
      columnSortOrder,
      createTaskMut,
      updateTaskMut,
      deleteTaskMut,
      queryClient,
    }),
    [
      tasks,
      total,
      listFilters,
      isFetching,
      isError,
      queryError,
      refetch,
      filterStatus,
      setFilterStatus,
      filterPriority,
      setFilterPriority,
      appliedSearch,
      setAppliedSearch,
      dateRange,
      setDateRange,
      overdueOnly,
      setOverdueOnly,
      tablePage,
      tablePageSize,
      sortBy,
      sortOrder,
      handleTableChange,
      columnSortOrder,
      createTaskMut,
      updateTaskMut,
      deleteTaskMut,
      queryClient,
    ]
  );

  return (
    <TasksBoardContext.Provider value={value}>
      {children}
    </TasksBoardContext.Provider>
  );
}

export function useTasksBoard() {
  const ctx = useContext(TasksBoardContext);
  if (!ctx) {
    throw new Error('useTasksBoard must be used within TasksBoardProvider');
  }
  return ctx;
}
