'use client';

import type { ChangeEvent } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Form, message } from 'antd';
import type { MenuProps } from 'antd';
import dayjs from 'dayjs';
import {
  llmDecompose,
  llmSuggestCategory,
  llmSuggestPriority,
  llmWorkloadSummaryStream,
} from '@/lib/api/tasksApi';
import { apiErr } from '@/lib/utils/apiErr';
import { useTasksBoard } from '@/state/tasksBoard';
import type { CategorySuggestion } from '@/views/TaskBoardPage/types/categorySuggestModal.types';
import type { TaskFormValues } from '@/lib/taskBoard/taskFormTypes';
import type { Priority, Task } from '@/types/task';
import type { Nullable } from '@/types/utility';

export function useTaskBoardModals() {
  const { createTaskMut, updateTaskMut } = useTasksBoard();

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editing, setEditing] = useState<Nullable<Task>>(null);
  const [form] = Form.useForm<TaskFormValues>();

  const [catTask, setCatTask] = useState<Nullable<Task>>(null);
  const [catLoading, setCatLoading] = useState(false);
  const [catSuggestion, setCatSuggestion] =
    useState<Nullable<CategorySuggestion>>(null);

  const [decTask, setDecTask] = useState<Nullable<Task>>(null);
  const [decLoading, setDecLoading] = useState(false);
  const [decItems, setDecItems] = useState<string[]>([]);

  const [priTask, setPriTask] = useState<Nullable<Task>>(null);
  const [priLoading, setPriLoading] = useState(false);
  const [priValue, setPriValue] = useState<Priority>('MEDIUM');
  const [priReason, setPriReason] = useState<string>('');

  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryText, setSummaryText] = useState('');

  useEffect(() => {
    if (!taskModalOpen) return;
    if (editing) {
      form.setFieldsValue({
        title: editing.title,
        description: editing.description ?? undefined,
        priority: editing.priority,
        status: editing.status,
        dueDate: editing.dueDate ? dayjs(editing.dueDate) : undefined,
        category: editing.category ?? undefined,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        priority: 'MEDIUM',
        status: 'PENDING',
      });
    }
  }, [taskModalOpen, editing, form]);

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

  const openSummary = useCallback(async () => {
    setSummaryOpen(true);
    setSummaryText('');
    setSummaryLoading(true);
    try {
      await llmWorkloadSummaryStream((chunk) => {
        setSummaryText((prev) => prev + chunk);
      });
    } catch (e) {
      message.error(apiErr(e));
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  const aiMenu = useCallback(
    (t: Task): MenuProps => ({
      items: [
        {
          key: 'cat',
          label: 'Предложить категорию',
          onClick: () => {
            void runCategory(t);
          },
        },
        {
          key: 'dec',
          label: 'Разбить на подзадачи',
          onClick: () => {
            void runDecompose(t);
          },
        },
        {
          key: 'pri',
          label: 'Предложить приоритет',
          onClick: () => {
            void runPriority(t);
          },
        },
      ],
    }),
    [runCategory, runDecompose, runPriority]
  );

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

  const handleSummaryModalCancel = useCallback(() => {
    setSummaryOpen(false);
  }, []);

  const handleSummaryCloseClick = useCallback(() => {
    setSummaryOpen(false);
  }, []);

  return {
    form,
    taskModalOpen,
    editing,
    openCreate,
    openEdit,
    handleTaskFormFinish,
    handleTaskModalCancel,
    catTask,
    catLoading,
    catSuggestion,
    handleCategoryModalCancel,
    handleCategoryAccept,
    handleCategoryReject,
    decTask,
    decLoading,
    decItems,
    handleDecomposeModalCancel,
    createDecItemChangeHandler,
    handleDecCreateClick,
    handleDecCancelClick,
    priTask,
    priLoading,
    priValue,
    priReason,
    handlePriorityModalCancel,
    handlePriValueChange,
    handlePriApplyClick,
    handlePriRejectClick,
    summaryOpen,
    summaryLoading,
    summaryText,
    handleSummaryModalCancel,
    handleSummaryCloseClick,
    openSummary,
    aiMenu,
  };
}
