'use client';

import type { HTMLAttributes } from 'react';
import { useMemo } from 'react';
import { Table } from 'antd';
import {
  buildTaskTableColumns,
  type TaskBoardTableSectionProps,
} from '@/views/TaskBoardPage/buildTaskTableColumns';
import type { Task } from '@/types/task';

const handlePaginationShowTotal = (t: number) => `Всего ${t}`;

function getTaskTableRowProps(
  record: Task
): HTMLAttributes<HTMLTableRowElement> {
  return {
    'data-testid': `e2e-task-row-${record.id}`,
  } as HTMLAttributes<HTMLTableRowElement>;
}

export function TaskBoardTableSection({
  tasks,
  total,
  isFetching,
  tablePage,
  tablePageSize,
  onTableChange,
  columnSortOrder,
  onEditRow,
  onDeleteRow,
  getAiMenu,
}: TaskBoardTableSectionProps) {
  const columns = useMemo(
    () =>
      buildTaskTableColumns({
        columnSortOrder,
        onEditRow,
        onDeleteRow,
        getAiMenu,
      }),
    [columnSortOrder, onEditRow, onDeleteRow, getAiMenu]
  );

  return (
    <Table<Task>
      data-testid="e2e-task-table"
      rowKey="id"
      loading={isFetching}
      columns={columns}
      dataSource={tasks}
      pagination={{
        current: tablePage,
        pageSize: tablePageSize,
        total,
        showSizeChanger: true,
        pageSizeOptions: ['10', '20', '50'],
        showTotal: handlePaginationShowTotal,
      }}
      scroll={{ x: true }}
      onChange={onTableChange}
      onRow={getTaskTableRowProps}
    />
  );
}
