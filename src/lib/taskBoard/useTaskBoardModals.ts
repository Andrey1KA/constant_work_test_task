'use client';

import { useCallback } from 'react';
import type { MenuProps } from 'antd';
import { useTasksBoard } from '@/state/tasksBoard';
import type { Task } from '@/types';
import { useTaskFormModal } from './useTaskFormModal';
import { useCategorySuggestModal } from './useCategorySuggestModal';
import { useDecomposeModal } from './useDecomposeModal';
import { usePrioritySuggestModal } from './usePrioritySuggestModal';
import { useWorkloadSummaryModal } from './useWorkloadSummaryModal';

export function useTaskBoardModals() {
  const { createTaskMut, updateTaskMut } = useTasksBoard();

  const taskFormModal = useTaskFormModal({ createTaskMut, updateTaskMut });
  const categoryModal = useCategorySuggestModal({ updateTaskMut });
  const decomposeModal = useDecomposeModal({ createTaskMut });
  const priorityModal = usePrioritySuggestModal({ updateTaskMut });
  const summaryModal = useWorkloadSummaryModal();

  const aiMenu = useCallback(
    (t: Task): MenuProps => ({
      items: [
        {
          key: 'cat',
          label: 'Предложить категорию',
          onClick: () => {
            void categoryModal.runCategory(t);
          },
        },
        {
          key: 'dec',
          label: 'Разбить на подзадачи',
          onClick: () => {
            void decomposeModal.runDecompose(t);
          },
        },
        {
          key: 'pri',
          label: 'Предложить приоритет',
          onClick: () => {
            void priorityModal.runPriority(t);
          },
        },
      ],
    }),
    [categoryModal, decomposeModal, priorityModal]
  );

  return {
    ...taskFormModal,
    ...categoryModal,
    ...decomposeModal,
    ...priorityModal,
    ...summaryModal,
    aiMenu,
  };
}
