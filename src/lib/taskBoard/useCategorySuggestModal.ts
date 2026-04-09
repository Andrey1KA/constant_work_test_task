'use client';

import { useCallback, useState } from 'react';
import { message } from 'antd';
import type { UseMutationResult } from '@tanstack/react-query';
import { llmSuggestCategory } from '@/lib/api';
import { apiErr } from '@/lib/utils/apiErr';
import type { Nullable, Task, TaskUpdateParams } from '@/types';
import type { CategorySuggestion } from '@/views/TaskBoardPage';

interface UseCategorySuggestModalParams {
  updateTaskMut: UseMutationResult<Task, unknown, TaskUpdateParams>;
}

export function useCategorySuggestModal({
  updateTaskMut,
}: UseCategorySuggestModalParams) {
  const [catTask, setCatTask] = useState<Nullable<Task>>(null);
  const [catLoading, setCatLoading] = useState(false);
  const [catSuggestion, setCatSuggestion] =
    useState<Nullable<CategorySuggestion>>(null);

  const runCategory = useCallback(async (t: Task) => {
    setCatTask(t);
    setCatSuggestion(null);
    setCatLoading(true);
    try {
      const r = await llmSuggestCategory({
        title: t.title,
        description: t.description,
      });
      setCatSuggestion(r);
    } catch (e) {
      message.error(apiErr(e));
      setCatTask(null);
    } finally {
      setCatLoading(false);
    }
  }, []);

  const handleCategoryModalCancel = useCallback(() => {
    setCatTask(null);
    setCatSuggestion(null);
  }, []);

  const handleCategoryAccept = useCallback(async () => {
    if (!catTask || !catSuggestion) return;
    try {
      await updateTaskMut.mutateAsync({
        id: catTask.id,
        patch: { category: catSuggestion.category },
      });
      message.success('Категория сохранена');
      setCatTask(null);
      setCatSuggestion(null);
    } catch (err) {
      message.error(apiErr(err));
    }
  }, [catSuggestion, catTask, updateTaskMut]);

  const handleCategoryReject = useCallback(() => {
    setCatTask(null);
    setCatSuggestion(null);
  }, []);

  return {
    catTask,
    catLoading,
    catSuggestion,
    runCategory,
    handleCategoryModalCancel,
    handleCategoryAccept,
    handleCategoryReject,
  };
}
