'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Descriptions, Spin, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import axios from 'axios';
import { getTask } from '@/lib/api/tasksApi';
import { taskKeys } from '@/lib/query/taskKeys';
import type { Priority, TaskStatus } from '@/types/task';

const { Title, Text } = Typography;

export interface TaskDetailPageProps {
  id: string;
}

const STATUS_LABEL: Record<TaskStatus, string> = {
  PENDING: 'Ожидает',
  IN_PROGRESS: 'В работе',
  DONE: 'Готово',
};

enum TaskPriorityKey {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

function priorityLabel(p: Priority): string {
  switch (p) {
    case TaskPriorityKey.LOW:
      return 'Низкий';
    case TaskPriorityKey.MEDIUM:
      return 'Средний';
    case TaskPriorityKey.HIGH:
      return 'Высокий';
    default:
      throw new Error(`Неизвестный приоритет: ${String(p)}`);
  }
}

function priorityColor(p: Priority): string {
  switch (p) {
    case TaskPriorityKey.HIGH:
      return 'red';
    case TaskPriorityKey.MEDIUM:
      return 'orange';
    case TaskPriorityKey.LOW:
      return 'blue';
    default:
      throw new Error(`Неизвестный приоритет: ${String(p)}`);
  }
}

export function TaskDetailPage({ id }: TaskDetailPageProps) {
  const { data: task, isPending, isError, error } = useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: () => getTask(id),
    retry: (failureCount, err) => {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        return false;
      }
      return failureCount < 2;
    },
  });

  const errorMessage = (() => {
    if (!isError || !error) return null;
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return 'Задача не найдена';
    }
    return 'Не удалось загрузить задачу';
  })();

  if (errorMessage) {
    return (
      <Card>
        <Text type="danger">{errorMessage}</Text>
        <div style={{ marginTop: 16 }}>
          <Link href="/tasks">
            <Button type="primary">К списку</Button>
          </Link>
        </div>
      </Card>
    );
  }

  if (isPending || !task) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Card>
      <Title level={3}>{task.title}</Title>
      <div style={{ marginBottom: 16 }}>
        <Link href="/tasks">
          <Button type="link">← К списку задач</Button>
        </Link>
      </div>
      <Descriptions bordered column={1} size="middle">
        <Descriptions.Item label="Описание">
          {task.description || '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Статус">
          {STATUS_LABEL[task.status]}
        </Descriptions.Item>
        <Descriptions.Item label="Приоритет">
          <Tag color={priorityColor(task.priority)}>
            {priorityLabel(task.priority)}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Срок">
          {task.dueDate ? dayjs(task.dueDate).format('DD.MM.YYYY') : '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Категория">
          {task.category || '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Создано">
          {dayjs(task.createdAt).format('DD.MM.YYYY HH:mm')}
        </Descriptions.Item>
        <Descriptions.Item label="Обновлено">
          {dayjs(task.updatedAt).format('DD.MM.YYYY HH:mm')}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
}
