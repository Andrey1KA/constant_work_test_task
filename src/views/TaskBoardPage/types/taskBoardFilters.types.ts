import type { CheckboxChangeEvent } from 'antd';
import type {
  DayjsRangePickerChangeValue,
  TaskBoardDateRange,
} from '@/types/dayjsRange';
import type { Priority, TaskStatus } from '@/types/task';

export type TaskBoardFiltersProps = {
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
};
