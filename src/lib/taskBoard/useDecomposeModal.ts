'use client';

import type { ChangeEvent } from 'react';
import { useCallback, useState } from 'react';
import { message } from 'antd';
import type { UseMutationResult } from '@tanstack/react-query';
import { llmDecompose } from '@/lib/api';
import { apiErr } from '@/lib/utils/apiErr';
import type { CreateTaskDTO, Nullable, Task } from '@/types';

interface UseDecomposeModalParams {
  createTaskMut: UseMutationResult<Task, unknown, CreateTaskDTO>;
}

export function useDecomposeModal({ createTaskMut }: UseDecomposeModalParams) {
  const [decTask, setDecTask] = useState<Nullable<Task>>(null);
  const [decLoading, setDecLoading] = useState(false);
  const [decItems, setDecItems] = useState<string[]>([]);

  const runDecompose = useCallback(async (t: Task) => {
    setDecTask(t);
    setDecItems([]);
    setDecLoading(true);
    try {
      const r = await llmDecompose({
        title: t.title,
        description: t.description,
      });
      setDecItems(r.subtasks);
    } catch (e) {
      message.error(apiErr(e));
      setDecTask(null);
    } finally {
      setDecLoading(false);
    }
  }, []);

  const handleDecomposeModalCancel = useCallback(() => {
    setDecTask(null);
  }, []);

  const createDecItemChangeHandler = useCallback((index: number) => {
    return function handleDecItemChange(e: ChangeEvent<HTMLInputElement>) {
      setDecItems((prev) => {
        const next = [...prev];
        next[index] = e.target.value;
        return next;
      });
    };
  }, []);

  const handleDecCreateClick = useCallback(async () => {
    const titles = decItems.map((s) => s.trim()).filter(Boolean);
    if (!titles.length) {
      message.warning('Нет подзадач');
      return;
    }
    if (!decTask) return;
    try {
      for (const title of titles) {
        await createTaskMut.mutateAsync({
          title,
          description: `Подзадача: ${decTask.title}`,
          priority: 'MEDIUM',
          status: 'PENDING',
          dueDate: decTask.dueDate,
          category: decTask.category,
        });
      }
      message.success('Подзадачи созданы');
      setDecTask(null);
      setDecItems([]);
    } catch (e) {
      message.error(apiErr(e));
    }
  }, [createTaskMut, decItems, decTask]);

  const handleDecCancelClick = useCallback(() => {
    setDecTask(null);
  }, []);

  return {
    decTask,
    decLoading,
    decItems,
    runDecompose,
    handleDecomposeModalCancel,
    createDecItemChangeHandler,
    handleDecCreateClick,
    handleDecCancelClick,
  };
}
