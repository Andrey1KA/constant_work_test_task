'use client';

import type { HTMLAttributes } from 'react';
import { useMemo, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  Button,
  Checkbox,
  DatePicker,
  Dropdown,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { MenuProps, TableProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import axios from 'axios';
import dayjs, { type Dayjs } from 'dayjs';
import {
  createTask,
  deleteTask,
  fetchTasks,
  llmDecompose,
  llmSuggestCategory,
  llmSuggestPriority,
  llmWorkloadSummaryStream,
  updateTask,
} from '@/lib/api/tasksApi';
import { taskKeys } from '@/lib/query/taskKeys';
import type {
  Priority,
  Task,
  TaskFilters,
  TaskPayload,
  TaskSortField,
  TaskStatus,
} from '@/types/task';
import {
  DownOutlined,
  PlusOutlined,
  RobotOutlined,
} from '@ant-design/icons';

const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { Title, Paragraph, Text } = Typography;

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'PENDING', label: 'Ожидает' },
  { value: 'IN_PROGRESS', label: 'В работе' },
  { value: 'DONE', label: 'Готово' },
];

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 'LOW', label: 'Низкий' },
  { value: 'MEDIUM', label: 'Средний' },
  { value: 'HIGH', label: 'Высокий' },
];

function statusLabel(s: TaskStatus) {
  return STATUS_OPTIONS.find((o) => o.value === s)?.label ?? s;
}

function priorityLabel(p: Priority) {
  return PRIORITY_OPTIONS.find((o) => o.value === p)?.label ?? p;
}

function priorityColor(p: Priority) {
  if (p === 'HIGH') return 'red';
  if (p === 'MEDIUM') return 'orange';
  return 'blue';
}

function apiErr(e: unknown) {
  if (axios.isAxiosError(e)) {
    const d = e.response?.data as { error?: { message?: string } } | undefined;
    return d?.error?.message ?? e.message;
  }
  if (e instanceof Error) return e.message;
  return 'Ошибка запроса';
}

type TaskFormValues = {
  title: string;
  description?: string;
  priority: Priority;
  status: TaskStatus;
  dueDate?: Dayjs | null;
  category?: string;
};

export function TaskBoardPage() {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<TaskStatus | undefined>();
  const [filterPriority, setFilterPriority] = useState<Priority | undefined>();
  const [appliedSearch, setAppliedSearch] = useState('');
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(20);
  const [sortBy, setSortBy] = useState<TaskSortField | undefined>();
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | undefined>();

  useEffect(() => {
    setTablePage(1);
  }, [filterStatus, filterPriority, appliedSearch, dateRange, overdueOnly]);

  const listFilters: TaskFilters = useMemo(
    () => ({
      status: filterStatus,
      priority: filterPriority,
      q: appliedSearch.trim() || undefined,
      dueFrom: dateRange
        ? dateRange[0].startOf('day').toISOString()
        : undefined,
      dueTo: dateRange
        ? dateRange[1].endOf('day').toISOString()
        : undefined,
      overdue: overdueOnly || undefined,
      page: tablePage,
      pageSize: tablePageSize,
      sortBy,
      sortOrder,
    }),
    [
      filterStatus,
      filterPriority,
      appliedSearch,
      dateRange,
      overdueOnly,
      tablePage,
      tablePageSize,
      sortBy,
      sortOrder,
    ]
  );

  const {
    data: listPayload,
    isFetching,
    isError,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: taskKeys.list(listFilters),
    queryFn: () => fetchTasks(listFilters),
    placeholderData: keepPreviousData,
  });

  const tasks = listPayload?.data ?? [];
  const listTotal = listPayload?.total ?? 0;

  const columnSortOrder = (
    field: TaskSortField
  ): 'ascend' | 'descend' | undefined => {
    if (sortBy !== field || !sortOrder) return undefined;
    return sortOrder === 'desc' ? 'descend' : 'ascend';
  };

  const handleTableChange: TableProps<Task>['onChange'] = (
    pagination,
    _filters,
    sorter,
    extra
  ) => {
    if (pagination?.current != null) setTablePage(pagination.current);
    if (
      pagination?.pageSize != null &&
      pagination.pageSize !== tablePageSize
    ) {
      setTablePageSize(pagination.pageSize);
      setTablePage(1);
    }
    if (extra.action === 'sort' && !Array.isArray(sorter)) {
      if (sorter.order && sorter.columnKey) {
        const key = String(sorter.columnKey) as TaskSortField;
        setSortBy(key);
        setSortOrder(sorter.order === 'descend' ? 'desc' : 'asc');
      } else {
        setSortBy(undefined);
        setSortOrder(undefined);
      }
    }
  };

  useEffect(() => {
    if (isError && queryError) {
      message.error(apiErr(queryError));
    }
  }, [isError, queryError]);

  const createTaskMut = useMutation({
    mutationFn: (payload: TaskPayload) => createTask(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });

  const updateTaskMut = useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<TaskPayload>;
    }) => updateTask(id, patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });

  const deleteTaskMut = useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: () => {
      message.success('Удалено');
      void queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
    onError: (e) => message.error(apiErr(e)),
  });

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [form] = Form.useForm<TaskFormValues>();

  const [catTask, setCatTask] = useState<Task | null>(null);
  const [catLoading, setCatLoading] = useState(false);
  const [catSuggestion, setCatSuggestion] = useState<{
    category: string;
    reasoning?: string;
  } | null>(null);

  const [decTask, setDecTask] = useState<Task | null>(null);
  const [decLoading, setDecLoading] = useState(false);
  const [decItems, setDecItems] = useState<string[]>([]);

  const [priTask, setPriTask] = useState<Task | null>(null);
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

  const openCreate = () => {
    setEditing(null);
    setTaskModalOpen(true);
  };

  const openEdit = (t: Task) => {
    setEditing(t);
    setTaskModalOpen(true);
  };

  const submitTask = async () => {
    try {
      const v = await form.validateFields();
      const payload: TaskPayload = {
        title: v.title.trim(),
        description: v.description?.trim() || null,
        priority: v.priority,
        status: v.status,
        dueDate: v.dueDate ? v.dueDate.toISOString() : null,
        category: v.category?.trim() || null,
      };
      if (editing) {
        await updateTaskMut.mutateAsync({ id: editing.id, patch: payload });
        message.success('Задача обновлена');
      } else {
        await createTaskMut.mutateAsync(payload);
        message.success('Задача создана');
      }
      setTaskModalOpen(false);
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return;
      message.error(apiErr(e));
    }
  };

  const runCategory = async (t: Task) => {
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
  };

  const runDecompose = async (t: Task) => {
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
  };

  const runPriority = async (t: Task) => {
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
  };

  const aiMenu = (t: Task): MenuProps => ({
    items: [
      {
        key: 'cat',
        label: 'Предложить категорию',
        onClick: () => void runCategory(t),
      },
      {
        key: 'dec',
        label: 'Разбить на подзадачи',
        onClick: () => void runDecompose(t),
      },
      {
        key: 'pri',
        label: 'Предложить приоритет',
        onClick: () => void runPriority(t),
      },
    ],
  });

  const openSummary = async () => {
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
  };

  const columns: ColumnsType<Task> = [
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
      render: (d: string | null) =>
        d ? dayjs(d).format('DD.MM.YYYY') : '—',
    },
    {
      title: 'Категория',
      dataIndex: 'category',
      key: 'category',
      width: 130,
      render: (c: string | null) => c || '—',
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
            onClick={() => openEdit(t)}
          >
            Изменить
          </Button>
          <Dropdown menu={aiMenu(t)}>
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
            onConfirm={() => deleteTaskMut.mutate(t.id)}
          >
            <Button data-testid={`e2e-task-delete-${t.id}`} size="small" danger>
              Удалить
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ width: '100%', maxWidth: 1280 }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }} wrap>
          <Title level={3} style={{ margin: 0 }}>
            Задачи
          </Title>
          <Space wrap>
            <Button
              data-testid="e2e-btn-workload"
              icon={<RobotOutlined />}
              onClick={() => void openSummary()}
            >
              Сводка нагрузки (ИИ)
            </Button>
            <Button
              data-testid="e2e-btn-new-task"
              type="primary"
              icon={<PlusOutlined />}
              onClick={openCreate}
            >
              Новая задача
            </Button>
          </Space>
        </Space>

        <Space wrap style={{ width: '100%' }} align="center">
          <Select
            data-testid="e2e-filter-status"
            allowClear
            placeholder="Статус"
            style={{ minWidth: 160 }}
            options={STATUS_OPTIONS}
            value={filterStatus}
            onChange={(v) => setFilterStatus(v)}
          />
          <Select
            data-testid="e2e-filter-priority"
            allowClear
            placeholder="Приоритет"
            style={{ minWidth: 160 }}
            options={PRIORITY_OPTIONS}
            value={filterPriority}
            onChange={(v) => setFilterPriority(v)}
          />
          <RangePicker
            value={dateRange}
            onChange={(v) => setDateRange(v as [Dayjs, Dayjs] | null)}
          />
          <Checkbox
            checked={overdueOnly}
            onChange={(e) => setOverdueOnly(e.target.checked)}
          >
            Только просроченные
          </Checkbox>
          <Input.Search
            data-testid="e2e-search-tasks"
            allowClear
            placeholder="Поиск по названию и описанию"
            onSearch={(v) => setAppliedSearch(v)}
            style={{ minWidth: 280 }}
          />
          <Button
            data-testid="e2e-btn-refresh"
            onClick={() => void refetch()}
            loading={isFetching}
          >
            Обновить
          </Button>
        </Space>

        <Table<Task>
          data-testid="e2e-task-table"
          rowKey="id"
          loading={isFetching}
          columns={columns}
          dataSource={tasks}
          pagination={{
            current: tablePage,
            pageSize: tablePageSize,
            total: listTotal,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            showTotal: (t) => `Всего ${t}`,
          }}
          scroll={{ x: true }}
          onChange={handleTableChange}
          onRow={(record) =>
            ({
              'data-testid': `e2e-task-row-${record.id}`,
            }) as HTMLAttributes<HTMLTableRowElement>
          }
        />
      </Space>

      <Modal
        data-testid="e2e-modal-task"
        title={editing ? 'Редактирование задачи' : 'Новая задача'}
        open={taskModalOpen}
        onCancel={() => setTaskModalOpen(false)}
        onOk={() => void submitTask()}
        okText="Сохранить"
        okButtonProps={{ 'data-testid': 'e2e-modal-task-ok' }}
        width={640}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          preserve={false}
          initialValues={{ priority: 'MEDIUM', status: 'PENDING' }}
        >
          <Form.Item
            name="title"
            label="Название"
            rules={[{ required: true, message: 'Введите название' }]}
          >
            <Input data-testid="e2e-input-task-title" maxLength={500} showCount />
          </Form.Item>
          <Form.Item name="description" label="Описание">
            <TextArea rows={4} maxLength={10000} showCount />
          </Form.Item>
          <Space style={{ width: '100%' }} size="large" wrap>
            <Form.Item
              name="priority"
              label="Приоритет"
              rules={[{ required: true }]}
              style={{ minWidth: 200 }}
            >
              <Select options={PRIORITY_OPTIONS} />
            </Form.Item>
            <Form.Item
              name="status"
              label="Статус"
              rules={[{ required: true }]}
              style={{ minWidth: 200 }}
            >
              <Select options={STATUS_OPTIONS} />
            </Form.Item>
            <Form.Item name="dueDate" label="Срок выполнения">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Space>
          <Form.Item name="category" label="Категория / тег">
            <Input maxLength={200} placeholder="Можно заполнить вручную или через ИИ" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        data-testid="e2e-modal-category"
        title="Предложить категорию (ИИ)"
        open={Boolean(catTask)}
        onCancel={() => {
          setCatTask(null);
          setCatSuggestion(null);
        }}
        footer={null}
        destroyOnClose
      >
        {catLoading ? (
          <Spin />
        ) : catSuggestion && catTask ? (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text>Предложение: {catSuggestion.category}</Text>
            {catSuggestion.reasoning ? (
              <Paragraph type="secondary">{catSuggestion.reasoning}</Paragraph>
            ) : null}
            <Space>
              <Button
                data-testid="e2e-cat-accept"
                type="primary"
                onClick={async () => {
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
                }}
              >
                Принять
              </Button>
              <Button
                data-testid="e2e-cat-reject"
                onClick={() => {
                  setCatTask(null);
                  setCatSuggestion(null);
                }}
              >
                Отклонить
              </Button>
            </Space>
          </Space>
        ) : null}
      </Modal>

      <Modal
        data-testid="e2e-modal-decompose"
        title="Разбить на подзадачи (ИИ)"
        open={Boolean(decTask)}
        onCancel={() => setDecTask(null)}
        footer={null}
        width={640}
        destroyOnClose
      >
        {decLoading ? (
          <Spin />
        ) : decTask ? (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text type="secondary">
              Отредактируйте подзадачи и примите — для каждой будет создана отдельная задача.
            </Text>
            {decItems.map((line, i) => (
              <Input
                key={i}
                data-testid={`e2e-dec-input-${i}`}
                value={line}
                onChange={(e) => {
                  const next = [...decItems];
                  next[i] = e.target.value;
                  setDecItems(next);
                }}
              />
            ))}
            <Space>
              <Button
                data-testid="e2e-dec-create"
                type="primary"
                onClick={async () => {
                  const titles = decItems.map((s) => s.trim()).filter(Boolean);
                  if (!titles.length) {
                    message.warning('Нет подзадач');
                    return;
                  }
                  try {
                    for (const title of titles) {
                      await createTask({
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
                    void queryClient.invalidateQueries({ queryKey: taskKeys.all });
                  } catch (e) {
                    message.error(apiErr(e));
                  }
                }}
              >
                Создать
              </Button>
              <Button data-testid="e2e-dec-cancel" onClick={() => setDecTask(null)}>
                Отмена
              </Button>
            </Space>
          </Space>
        ) : null}
      </Modal>

      <Modal
        data-testid="e2e-modal-priority"
        title="Предложить приоритет (ИИ)"
        open={Boolean(priTask)}
        onCancel={() => setPriTask(null)}
        footer={null}
        destroyOnClose
      >
        {priLoading ? (
          <Spin />
        ) : priTask ? (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Select
              value={priValue}
              style={{ width: '100%' }}
              options={PRIORITY_OPTIONS}
              onChange={(v) => setPriValue(v)}
            />
            {priReason ? <Paragraph type="secondary">{priReason}</Paragraph> : null}
            <Space>
              <Button
                data-testid="e2e-pri-apply"
                type="primary"
                onClick={async () => {
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
                }}
              >
                Применить
              </Button>
              <Button data-testid="e2e-pri-reject" onClick={() => setPriTask(null)}>
                Отклонить
              </Button>
            </Space>
          </Space>
        ) : null}
      </Modal>

      <Modal
        data-testid="e2e-modal-summary"
        title="Сводка нагрузки"
        open={summaryOpen}
        onCancel={() => setSummaryOpen(false)}
        footer={
          <Button
            data-testid="e2e-summary-close"
            type="primary"
            onClick={() => setSummaryOpen(false)}
          >
            Закрыть
          </Button>
        }
        width={720}
        destroyOnClose
      >
        {summaryLoading && !summaryText ? (
          <Spin data-testid="e2e-summary-loading" />
        ) : null}
        {summaryText ? (
          <Paragraph
            data-testid="e2e-summary-text"
            style={{ whiteSpace: 'pre-wrap' }}
          >
            {summaryText}
          </Paragraph>
        ) : null}
        {summaryLoading && summaryText ? (
          <div style={{ marginTop: 8 }}>
            <Spin size="small" />
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
