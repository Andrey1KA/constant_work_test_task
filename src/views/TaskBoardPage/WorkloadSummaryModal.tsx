'use client';

import { Button, Modal, Spin, Typography } from 'antd';

const { Paragraph } = Typography;

export interface WorkloadSummaryModalProps {
  open: boolean;
  loading: boolean;
  text: string;
  onCancel: () => void;
  onClose: () => void;
}

export function WorkloadSummaryModal({
  open,
  loading,
  text,
  onCancel,
  onClose,
}: WorkloadSummaryModalProps) {
  return (
    <Modal
      data-testid="e2e-modal-summary"
      title="Сводка нагрузки"
      open={open}
      onCancel={onCancel}
      footer={
        <Button
          data-testid="e2e-summary-close"
          type="primary"
          onClick={onClose}
        >
          Закрыть
        </Button>
      }
      width={720}
      destroyOnHidden
    >
      {loading && !text ? (
        <Spin data-testid="e2e-summary-loading" />
      ) : null}
      {text ? (
        <Paragraph
          data-testid="e2e-summary-text"
          style={{ whiteSpace: 'pre-wrap' }}
        >
          {text}
        </Paragraph>
      ) : null}
      {loading && text ? (
        <div style={{ marginTop: 8 }}>
          <Spin size="small" />
        </div>
      ) : null}
    </Modal>
  );
}
