'use client';

import { useMutation, type QueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import {
  createTask,
  deleteTask,
  updateTask,
} from '@/lib/api';
import { taskKeys } from '@/lib/query/taskKeys';
import { apiErr } from '@/lib/utils/apiErr';
import type { CreateTaskDTO, TaskUpdateParams } from '@/types';

function invalidateTaskQueries(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: taskKeys.all });
}

export function useTasksBoardMutations(queryClient: QueryClient) {
  const createTaskMut = useMutation({
    mutationFn: (payload: CreateTaskDTO) => createTask(payload),
    onSuccess: () => {
      invalidateTaskQueries(queryClient);
    },
  });

  const updateTaskMut = useMutation({
    mutationFn: ({ id, patch }: TaskUpdateParams) => updateTask(id, patch),
    onSuccess: (_task, { id }) => {
      invalidateTaskQueries(queryClient);
      void queryClient.invalidateQueries({ queryKey: taskKeys.detail(id) });
    },
  });

  const deleteTaskMut = useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: (_, id) => {
      message.success('Удалено');
      invalidateTaskQueries(queryClient);
      void queryClient.invalidateQueries({ queryKey: taskKeys.detail(id) });
    },
    onError: (e) => message.error(apiErr(e)),
  });

  return {
    createTaskMut,
    updateTaskMut,
    deleteTaskMut,
  };
}
