'use client';

import type { ChangeEvent } from 'react';
import { Button, Input, Modal, Space, Spin, Typography } from 'antd';
import type { Task } from '@/types/task';
import type { Nullable } from '@/types/utility';

const { Text } = Typography;

export interface DecomposeSubtasksModalProps {
  open: boolean;
  loading: boolean;
  task: Nullable<Task>;
  items: string[];
  getLineChangeHandler: (
    index: number
  ) => (e: ChangeEvent<HTMLInputElement>) => void;
  onCancel: () => void;
  onCreate: () => void;
}

export function DecomposeSubtasksModal({
  open,
  loading,
  task,
  items,
  getLineChangeHandler,
  onCancel,
  onCreate,
}: DecomposeSubtasksModalProps) {
  return (
    <Modal
      data-testid="e2e-modal-decompose"
      title="Разбить на подзадачи (ИИ)"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={640}
      destroyOnClose
    >
      {loading ? (
        <Spin />
      ) : task ? (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text type="secondary">
            Отредактируйте подзадачи и примите — для каждой будет создана
            отдельная задача.
          </Text>
          {items.map((line, i) => (
            <Input
              key={i}
              data-testid={`e2e-dec-input-${i}`}
              value={line}
              onChange={getLineChangeHandler(i)}
            />
          ))}
          <Space>
            <Button
              data-testid="e2e-dec-create"
              type="primary"
              onClick={onCreate}
            >
              Создать
            </Button>
            <Button data-testid="e2e-dec-cancel" onClick={onCancel}>
              Отмена
            </Button>
          </Space>
        </Space>
      ) : null}
    </Modal>
  );
}
