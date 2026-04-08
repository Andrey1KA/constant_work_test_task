'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { TableProps } from 'antd';
import type { TablePaginationConfig } from 'antd/es/table/interface';
import { message } from 'antd';
import {
  createTask,
  deleteTask,
  fetchTasks,
  updateTask,
} from '@/lib/api/tasksApi';
import { taskKeys } from '@/lib/query/taskKeys';
import { apiErr } from '@/lib/utils/apiErr';
import type {
  TaskListTableFiltersRecord,
  TaskListTableSorter,
} from '@/state/tasksBoard/types/tasksBoardTableHandler.types';
import type {
  PriorityFilterValue,
  TaskSortByValue,
  TaskSortOrderValue,
  TaskStatusFilterValue,
} from '@/state/tasksBoard/types/boardFilterState.types';
import type { TasksBoardContextValue } from '@/state/tasksBoard/types/tasksBoardContext.types';
import type { TaskTableColumnSortOrder } from '@/types/antdTable';
import type { TaskBoardDateRange } from '@/types/dayjsRange';
import type {
  Task,
  TaskFilters,
  TaskPayload,
  TaskSortField,
} from '@/types/task';
import type { TaskUpdateParams } from '@/types/taskMutation';
import type { Nullable } from '@/types/utility';

const EMPTY_TASKS: Task[] = [];

const TasksBoardContext = createContext<Nullable<TasksBoardContextValue>>(null);

export function TasksBoardProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<TaskStatusFilterValue>();
  const [filterPriority, setFilterPriority] = useState<PriorityFilterValue>();
  const [appliedSearch, setAppliedSearch] = useState('');
  const [dateRange, setDateRange] = useState<TaskBoardDateRange>(null);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(20);
  const [sortBy, setSortBy] = useState<TaskSortByValue>();
  const [sortOrder, setSortOrder] = useState<TaskSortOrderValue>();

  useEffect(() => {
    setTablePage(1);
  }, [filterStatus, filterPriority, appliedSearch, dateRange, overdueOnly]);

  const listFilters: TaskFilters = useMemo(
    () => ({
      status: filterStatus,
      priority: filterPriority,
      q: appliedSearch.trim() || undefined,
      dueFrom: dateRange
        ? dateRange[0].startOf('day').toISOString()
        : undefined,
      dueTo: dateRange
        ? dateRange[1].endOf('day').toISOString()
        : undefined,
      overdue: overdueOnly || undefined,
      page: tablePage,
      pageSize: tablePageSize,
      sortBy,
      sortOrder,
    }),
    [
      filterStatus,
      filterPriority,
      appliedSearch,
      dateRange,
      overdueOnly,
      tablePage,
      tablePageSize,
      sortBy,
      sortOrder,
    ]
  );

  const {
    data: listPayload,
    isFetching,
    isError,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: taskKeys.list(listFilters),
    queryFn: () => fetchTasks(listFilters),
    placeholderData: keepPreviousData,
  });

  const tasks = listPayload?.data ?? EMPTY_TASKS;
  const total = listPayload?.total ?? 0;

  useEffect(() => {
    if (isError && queryError) {
      message.error(apiErr(queryError));
    }
  }, [isError, queryError]);

  const createTaskMut = useMutation({
    mutationFn: (payload: TaskPayload) => createTask(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });

  const updateTaskMut = useMutation({
    mutationFn: ({ id, patch }: TaskUpdateParams) => updateTask(id, patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });

  const deleteTaskMut = useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: () => {
      message.success('Удалено');
      void queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
    onError: (e) => message.error(apiErr(e)),
  });

  const columnSortOrder = useCallback(
    (field: TaskSortField): TaskTableColumnSortOrder => {
      if (sortBy !== field || !sortOrder) return undefined;
      return sortOrder === 'desc' ? 'descend' : 'ascend';
    },
    [sortBy, sortOrder]
  );

  const handleTableChange: TableProps<Task>['onChange'] = useCallback(
    (
      pagination: TablePaginationConfig,
      _filters: TaskListTableFiltersRecord,
      sorter: TaskListTableSorter,
      extra: Parameters<NonNullable<TableProps<Task>['onChange']>>[3]
    ) => {
      if (pagination?.current != null) setTablePage(pagination.current);
      if (
        pagination?.pageSize != null &&
        pagination.pageSize !== tablePageSize
      ) {
        setTablePageSize(pagination.pageSize);
        setTablePage(1);
      }
      if (extra.action === 'sort' && !Array.isArray(sorter)) {
        if (sorter.order && sorter.columnKey) {
          const key = String(sorter.columnKey) as TaskSortField;
          setSortBy(key);
          setSortOrder(sorter.order === 'descend' ? 'desc' : 'asc');
        } else {
          setSortBy(undefined);
          setSortOrder(undefined);
        }
      }
    },
    [tablePageSize]
  );

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
      filterPriority,
      appliedSearch,
      dateRange,
      overdueOnly,
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
