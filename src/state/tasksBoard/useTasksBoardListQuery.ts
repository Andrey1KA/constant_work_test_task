'use client';

import { useEffect } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { message } from 'antd';
import { fetchTasks } from '@/lib/api';
import { taskKeys } from '@/lib/query/taskKeys';
import { apiErr } from '@/lib/utils/apiErr';
import type { TaskFilters } from '@/types';

export function useTasksBoardListQuery(listFilters: TaskFilters) {
  const query = useQuery({
    queryKey: taskKeys.list(listFilters),
    queryFn: () => fetchTasks(listFilters),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (query.isError && query.error) {
      message.error(apiErr(query.error));
    }
  }, [query.isError, query.error]);

  return query;
}
