'use client';

import { useEffect } from 'react';
import type { Priority, TaskBoardDateRange, TaskStatus } from '@/types';

interface UseResetTablePageOnFiltersChangeParams {
  filterStatus?: TaskStatus;
  filterPriority?: Priority;
  appliedSearch: string;
  dateRange: TaskBoardDateRange;
  overdueOnly: boolean;
  setTablePage: (page: number) => void;
}

export function useResetTablePageOnFiltersChange({
  filterStatus,
  filterPriority,
  appliedSearch,
  dateRange,
  overdueOnly,
  setTablePage,
}: UseResetTablePageOnFiltersChangeParams) {
  useEffect(() => {
    setTablePage(1);
  }, [
    filterStatus,
    filterPriority,
    appliedSearch,
    dateRange,
    overdueOnly,
    setTablePage,
  ]);
}
