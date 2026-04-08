import type { MenuProps } from 'antd';
import type { TableProps } from 'antd';
import type { TaskTableColumnSortOrder } from '@/types/antdTable';
import type { Task, TaskSortField } from '@/types/task';

export type { TaskTableColumnSortOrder } from '@/types/antdTable';

export type BuildTaskTableColumnsParams = {
  columnSortOrder: (
    field: TaskSortField
  ) => TaskTableColumnSortOrder;
  onEditRow: (task: Task) => void;
  onDeleteRow: (id: string) => void;
  getAiMenu: (task: Task) => MenuProps;
};

export type TaskBoardTableSectionProps = {
  tasks: Task[];
  total: number;
  isFetching: boolean;
  tablePage: number;
  tablePageSize: number;
  onTableChange: TableProps<Task>['onChange'];
  columnSortOrder: (
    field: TaskSortField
  ) => TaskTableColumnSortOrder;
  onEditRow: (task: Task) => void;
  onDeleteRow: (id: string) => void;
  getAiMenu: (task: Task) => MenuProps;
};
