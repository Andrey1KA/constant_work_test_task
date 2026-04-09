'use client';

import {
  Button,
  Checkbox,
  DatePicker,
  Input,
  Select,
  Space,
  type CheckboxChangeEvent,
} from 'antd';
import {
  PRIORITY_OPTIONS,
  STATUS_OPTIONS,
} from '@/lib/taskBoard';
import type {
  DayjsRangePickerChangeValue,
  TaskBoardDateRange,
  Priority,
  TaskStatus,
} from '@/types';

const { RangePicker } = DatePicker;

export interface TaskBoardFiltersProps {
  filterStatus?: TaskStatus;
  onFilterStatusChange: (value?: TaskStatus) => void;
  filterPriority?: Priority;
  onFilterPriorityChange: (value?: Priority) => void;
  dateRange: TaskBoardDateRange;
  onDateRangeChange: (dates: DayjsRangePickerChangeValue) => void;
  overdueOnly: boolean;
  onOverdueOnlyChange: (e: CheckboxChangeEvent) => void;
  onSearch: (value: string) => void;
  onRefreshClick: () => void;
  isRefreshing: boolean;
}

export function TaskBoardFilters({
  filterStatus,
  onFilterStatusChange,
  filterPriority,
  onFilterPriorityChange,
  dateRange,
  onDateRangeChange,
  overdueOnly,
  onOverdueOnlyChange,
  onSearch,
  onRefreshClick,
  isRefreshing,
}: TaskBoardFiltersProps) {
  return (
    <Space wrap style={{ width: '100%' }} align="center">
      <Select
        data-testid="e2e-filter-status"
        allowClear
        placeholder="Статус"
        style={{ minWidth: 160 }}
        options={STATUS_OPTIONS}
        value={filterStatus}
        onChange={onFilterStatusChange}
      />
      <Select
        data-testid="e2e-filter-priority"
        allowClear
        placeholder="Приоритет"
        style={{ minWidth: 160 }}
        options={PRIORITY_OPTIONS}
        value={filterPriority}
        onChange={onFilterPriorityChange}
      />
      <RangePicker value={dateRange} onChange={onDateRangeChange} />
      <Checkbox checked={overdueOnly} onChange={onOverdueOnlyChange}>
        Только просроченные
      </Checkbox>
      <Input.Search
        data-testid="e2e-search-tasks"
        allowClear
        placeholder="Поиск по названию и описанию"
        onSearch={onSearch}
        style={{ minWidth: 280 }}
      />
      <Button
        data-testid="e2e-btn-refresh"
        onClick={onRefreshClick}
        loading={isRefreshing}
      >
        Обновить
      </Button>
    </Space>
  );
}
