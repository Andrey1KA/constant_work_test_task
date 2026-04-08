'use client';

import { Button, Modal, Space, Spin, Typography } from 'antd';
import type { CategorySuggestModalProps } from '@/views/TaskBoardPage/types/categorySuggestModal.types';

const { Paragraph, Text } = Typography;

export function CategorySuggestModal({
  open,
  loading,
  task,
  suggestion,
  onCancel,
  onAccept,
  onReject,
}: CategorySuggestModalProps) {
  return (
    <Modal
      data-testid="e2e-modal-category"
      title="Предложить категорию (ИИ)"
      open={open}
      onCancel={onCancel}
      footer={null}
      destroyOnClose
    >
      {loading ? (
        <Spin />
      ) : suggestion && task ? (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>Предложение: {suggestion.category}</Text>
          {suggestion.reasoning ? (
            <Paragraph type="secondary">{suggestion.reasoning}</Paragraph>
          ) : null}
          <Space>
            <Button
              data-testid="e2e-cat-accept"
              type="primary"
              onClick={onAccept}
            >
              Принять
            </Button>
            <Button data-testid="e2e-cat-reject" onClick={onReject}>
              Отклонить
            </Button>
          </Space>
        </Space>
      ) : null}
    </Modal>
  );
}
