'use client';

import { useCallback, useState } from 'react';
import { message } from 'antd';
import type { UseMutationResult } from '@tanstack/react-query';
import { llmSuggestPriority } from '@/lib/api';
import { apiErr } from '@/lib/utils/apiErr';
import type { Nullable, Priority, Task, TaskUpdateParams } from '@/types';

interface UsePrioritySuggestModalParams {
  updateTaskMut: UseMutationResult<Task, unknown, TaskUpdateParams>;
}

export function usePrioritySuggestModal({
  updateTaskMut,
}: UsePrioritySuggestModalParams) {
  const [priTask, setPriTask] = useState<Nullable<Task>>(null);
  const [priLoading, setPriLoading] = useState(false);
  const [priValue, setPriValue] = useState<Priority>('MEDIUM');
  const [priReason, setPriReason] = useState('');

  const runPriority = useCallback(async (t: Task) => {
    setPriTask(t);
    setPriLoading(true);
    setPriReason('');
    try {
      const r = await llmSuggestPriority({
        title: t.title,
        description: t.description,
        dueDate: t.dueDate,
      });
      setPriValue(r.priority);
      setPriReason(r.reasoning ?? '');
    } catch (e) {
      message.error(apiErr(e));
      setPriTask(null);
    } finally {
      setPriLoading(false);
    }
  }, []);

  const handlePriorityModalCancel = useCallback(() => {
    setPriTask(null);
  }, []);

  const handlePriValueChange = useCallback((v: Priority) => {
    setPriValue(v);
  }, []);

  const handlePriApplyClick = useCallback(async () => {
    if (!priTask) return;
    try {
      await updateTaskMut.mutateAsync({
        id: priTask.id,
        patch: { priority: priValue },
      });
      message.success('Приоритет обновлён');
      setPriTask(null);
    } catch (err) {
      message.error(apiErr(err));
    }
  }, [priTask, priValue, updateTaskMut]);

  const handlePriRejectClick = useCallback(() => {
    setPriTask(null);
  }, []);

  return {
    priTask,
    priLoading,
    priValue,
    priReason,
    runPriority,
    handlePriorityModalCancel,
    handlePriValueChange,
    handlePriApplyClick,
    handlePriRejectClick,
  };
}
