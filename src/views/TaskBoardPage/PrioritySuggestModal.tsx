'use client';

import { Button, Modal, Select, Space, Spin, Typography } from 'antd';
import { PRIORITY_OPTIONS } from '@/lib/taskBoard';
import type { Nullable, Priority, Task } from '@/types';

const { Paragraph } = Typography;

export interface PrioritySuggestModalProps {
  open: boolean;
  loading: boolean;
  task: Nullable<Task>;
  value: Priority;
  reason: string;
  onValueChange: (value: Priority) => void;
  onCancel: () => void;
  onApply: () => void;
  onReject: () => void;
}

export function PrioritySuggestModal({
  open,
  loading,
  task,
  value,
  reason,
  onValueChange,
  onCancel,
  onApply,
  onReject,
}: PrioritySuggestModalProps) {
  return (
    <Modal
      data-testid="e2e-modal-priority"
      title="Предложить приоритет (ИИ)"
      open={open}
      onCancel={onCancel}
      footer={null}
      destroyOnHidden
    >
      {loading ? (
        <Spin />
      ) : task ? (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Select
            value={value}
            style={{ width: '100%' }}
            options={PRIORITY_OPTIONS}
            onChange={onValueChange}
          />
          {reason ? <Paragraph type="secondary">{reason}</Paragraph> : null}
          <Space>
            <Button
              data-testid="e2e-pri-apply"
              type="primary"
              onClick={onApply}
            >
              Применить
            </Button>
            <Button data-testid="e2e-pri-reject" onClick={onReject}>
              Отклонить
            </Button>
          </Space>
        </Space>
      ) : null}
    </Modal>
  );
}
