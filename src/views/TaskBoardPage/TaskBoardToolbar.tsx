'use client';

import { Button, Space, Typography } from 'antd';
import { PlusOutlined, RobotOutlined } from '@ant-design/icons';

const { Title } = Typography;

export interface TaskBoardToolbarProps {
  onWorkloadClick: () => void;
  onNewTaskClick: () => void;
}

export function TaskBoardToolbar({
  onWorkloadClick,
  onNewTaskClick,
}: TaskBoardToolbarProps) {
  return (
    <Space
      align="center"
      style={{ justifyContent: 'space-between', width: '100%' }}
      wrap
    >
      <Title level={3} style={{ margin: 0 }}>
        Задачи
      </Title>
      <Space wrap>
        <Button
          data-testid="e2e-btn-workload"
          icon={<RobotOutlined />}
          onClick={onWorkloadClick}
        >
          Сводка нагрузки (ИИ)
        </Button>
        <Button
          data-testid="e2e-btn-new-task"
          type="primary"
          icon={<PlusOutlined />}
          onClick={onNewTaskClick}
        >
          Новая задача
        </Button>
      </Space>
    </Space>
  );
}
