'use client';

import { Button, Checkbox, DatePicker, Input, Select, Space } from 'antd';
import {
  PRIORITY_OPTIONS,
  STATUS_OPTIONS,
} from '@/lib/taskBoard/constants';
import type { TaskBoardFiltersProps } from '@/views/TaskBoardPage/types/taskBoardFilters.types';

const { RangePicker } = DatePicker;

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
