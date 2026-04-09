'use client';

import { useCallback, useState } from 'react';
import { Form, message } from 'antd';
import type { UseMutationResult } from '@tanstack/react-query';
import { apiErr } from '@/lib/utils/apiErr';
import type {
  CreateTaskDTO,
  Nullable,
  Task,
  TaskFormValues,
  TaskUpdateParams,
} from '@/types';

interface UseTaskFormModalParams {
  createTaskMut: UseMutationResult<Task, unknown, CreateTaskDTO>;
  updateTaskMut: UseMutationResult<Task, unknown, TaskUpdateParams>;
}

export function useTaskFormModal({
  createTaskMut,
  updateTaskMut,
}: UseTaskFormModalParams) {
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editing, setEditing] = useState<Nullable<Task>>(null);
  const [form] = Form.useForm<TaskFormValues>();

  const openCreate = useCallback(() => {
    setEditing(null);
    setTaskModalOpen(true);
  }, []);

  const openEdit = useCallback((t: Task) => {
    setEditing(t);
    setTaskModalOpen(true);
  }, []);

  const handleTaskFormFinish = useCallback(
    async (v: TaskFormValues) => {
      const payload = {
        title: v.title.trim(),
        description: v.description?.trim() || null,
        priority: v.priority,
        status: v.status,
        dueDate: v.dueDate ? v.dueDate.toISOString() : null,
        category: v.category?.trim() || null,
      };

      try {
        if (editing) {
          await updateTaskMut.mutateAsync({ id: editing.id, patch: payload });
          message.success('Задача обновлена');
        } else {
          await createTaskMut.mutateAsync(payload);
          message.success('Задача создана');
        }
        setTaskModalOpen(false);
      } catch (e) {
        message.error(apiErr(e));
      }
    },
    [createTaskMut, editing, updateTaskMut]
  );

  const handleTaskModalCancel = useCallback(() => {
    setTaskModalOpen(false);
  }, []);

  return {
    form,
    taskModalOpen,
    editing,
    openCreate,
    openEdit,
    handleTaskFormFinish,
    handleTaskModalCancel,
  };
}
