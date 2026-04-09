'use client';

import { useCallback, useMemo, useState } from 'react';
import type { TableProps } from 'antd';
import type {
  FilterValue,
  SorterResult,
  TablePaginationConfig,
} from 'antd/es/table/interface';
import type {
  Nullable,
  Optional,
  Priority,
  Task,
  TaskBoardDateRange,
  TaskFilters,
  TaskListSortOrder,
  TaskSortField,
  TaskStatus,
  TaskTableColumnSortOrder,
} from '@/types';
import { useResetTablePageOnFiltersChange } from '@/state/tasksBoard/useResetTablePageOnFiltersChange';

type TaskStatusFilterValue = Optional<TaskStatus>;
type PriorityFilterValue = Optional<Priority>;
type TaskSortByValue = Optional<TaskSortField>;
type TaskSortOrderValue = Optional<TaskListSortOrder>;

type TaskListTableSorterSingle = SorterResult<Task>;
type TaskListTableSorterArray = SorterResult<Task>[];
type TaskListTableSorter = TaskListTableSorterSingle | TaskListTableSorterArray;
type TaskListTableFiltersRecord = Record<string, Nullable<FilterValue>>;

export function useTasksBoardFilters() {
  const [filterStatus, setFilterStatus] = useState<TaskStatusFilterValue>();
  const [filterPriority, setFilterPriority] = useState<PriorityFilterValue>();
  const [appliedSearch, setAppliedSearch] = useState('');
  const [dateRange, setDateRange] = useState<TaskBoardDateRange>(null);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(20);
  const [sortBy, setSortBy] = useState<TaskSortByValue>();
  const [sortOrder, setSortOrder] = useState<TaskSortOrderValue>();

  useResetTablePageOnFiltersChange({
    filterStatus,
    filterPriority,
    appliedSearch,
    dateRange,
    overdueOnly,
    setTablePage,
  });

  const listFilters: TaskFilters = useMemo(
    () => ({
      status: filterStatus,
      priority: filterPriority,
      q: appliedSearch.trim() || undefined,
      dueFrom: dateRange ? dateRange[0].startOf('day').toISOString() : undefined,
      dueTo: dateRange ? dateRange[1].endOf('day').toISOString() : undefined,
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

  return {
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
  };
}
