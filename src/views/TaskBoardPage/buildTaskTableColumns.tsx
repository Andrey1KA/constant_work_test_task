import Link from 'next/link';
import { Button, Dropdown, Popconfirm, Space, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { DownOutlined, RobotOutlined } from '@ant-design/icons';
import type { BuildTaskTableColumnsParams } from '@/views/TaskBoardPage/types/taskBoardTable.types';
import {
  priorityColor,
  priorityLabel,
  statusLabel,
} from '@/lib/taskBoard/labels';
import type { Priority, Task, TaskStatus } from '@/types/task';
import type { Nullable } from '@/types/utility';

const { Text } = Typography;

export function buildTaskTableColumns({
  columnSortOrder,
  onEditRow,
  onDeleteRow,
  getAiMenu,
}: BuildTaskTableColumnsParams): ColumnsType<Task> {
  return [
    {
      title: 'Название',
      dataIndex: 'title',
      key: 'title',
      sorter: true,
      sortOrder: columnSortOrder('title'),
      width: 220,
      render: (v: string, r) => (
        <Space direction="vertical" size={0}>
          <Link href={`/task/${r.id}`}>
            <Text strong>{v}</Text>
          </Link>
          {r.description ? (
            <Text type="secondary" ellipsis style={{ maxWidth: 260 }}>
              {r.description}
            </Text>
          ) : null}
        </Space>
      ),
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      sorter: true,
      sortOrder: columnSortOrder('status'),
      width: 120,
      render: (s: TaskStatus) => statusLabel(s),
    },
    {
      title: 'Приоритет',
      dataIndex: 'priority',
      key: 'priority',
      sorter: true,
      sortOrder: columnSortOrder('priority'),
      width: 110,
      render: (p: Priority) => (
        <Tag color={priorityColor(p)}>{priorityLabel(p)}</Tag>
      ),
    },
    {
      title: 'Срок',
      dataIndex: 'dueDate',
      key: 'dueDate',
      sorter: true,
      sortOrder: columnSortOrder('dueDate'),
      width: 120,
      render: (d: Nullable<string>) =>
        d ? dayjs(d).format('DD.MM.YYYY') : '—',
    },
    {
      title: 'Категория',
      dataIndex: 'category',
      key: 'category',
      width: 130,
      render: (c: Nullable<string>) => c || '—',
    },
    {
      title: 'Создано',
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: true,
      sortOrder: columnSortOrder('createdAt'),
      width: 120,
      render: (d: string) => dayjs(d).format('DD.MM.YYYY HH:mm'),
    },
    {
      title: '',
      key: 'actions',
      width: 280,
      render: (_: unknown, t) => (
        <Space wrap>
          <Button
            data-testid={`e2e-task-edit-${t.id}`}
            size="small"
            onClick={onEditRow.bind(null, t)}
          >
            Изменить
          </Button>
          <Dropdown menu={getAiMenu(t)}>
            <Button
              data-testid={`e2e-task-ai-${t.id}`}
              size="small"
              icon={<RobotOutlined />}
            >
              ИИ <DownOutlined />
            </Button>
          </Dropdown>
          <Popconfirm
            title="Удалить задачу?"
            okText="Да"
            cancelText="Нет"
            onConfirm={onDeleteRow.bind(null, t.id)}
          >
            <Button data-testid={`e2e-task-delete-${t.id}`} size="small" danger>
              Удалить
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];
}
