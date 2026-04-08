'use client';

import { Button, DatePicker, Form, Input, Modal, Select, Space } from 'antd';
import {
  PRIORITY_OPTIONS,
  STATUS_OPTIONS,
} from '@/lib/taskBoard/constants';
import type { TaskFormValues } from '@/types/taskForm';
import type { Task } from '@/types/task';
import type { Awaitable, Nullable } from '@/types/utility';
import type { FormInstance } from 'antd/es/form';

const { TextArea } = Input;

export interface TaskFormModalProps {
  open: boolean;
  editing: Nullable<Task>;
  form: FormInstance<TaskFormValues>;
  onCancel: () => void;
  onFinish: (values: TaskFormValues) => Awaitable<void>;
  isSubmitting: boolean;
}

export function TaskFormModal({
  open,
  editing,
  form,
  onCancel,
  onFinish,
  isSubmitting,
}: TaskFormModalProps) {
  return (
    <Modal
      data-testid="e2e-modal-task"
      title={editing ? 'Редактирование задачи' : 'Новая задача'}
      open={open}
      onCancel={onCancel}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={onCancel}>Отмена</Button>
          <Button
            type="primary"
            form="task-form"
            htmlType="submit"
            data-testid="e2e-modal-task-ok"
            loading={isSubmitting}
          >
            Сохранить
          </Button>
        </div>
      }
      width={640}
      destroyOnClose
    >
      <Form<TaskFormValues>
        id="task-form"
        form={form}
        layout="vertical"
        preserve={false}
        initialValues={{ priority: 'MEDIUM', status: 'PENDING' }}
        onFinish={onFinish}
      >
        <Form.Item
          name="title"
          label="Название"
          rules={[
            { required: true, message: 'Введите название' },
            { whitespace: true, message: 'Название не может быть пустым' },
            { max: 500, message: 'Не более 500 символов' },
          ]}
        >
          <Input data-testid="e2e-input-task-title" maxLength={500} showCount />
        </Form.Item>
        <Form.Item
          name="description"
          label="Описание"
          rules={[{ max: 10000, message: 'Не более 10000 символов' }]}
        >
          <TextArea rows={4} maxLength={10000} showCount />
        </Form.Item>
        <Space style={{ width: '100%' }} size="large" wrap>
          <Form.Item
            name="priority"
            label="Приоритет"
            rules={[{ required: true, message: 'Выберите приоритет' }]}
            style={{ minWidth: 200 }}
          >
            <Select options={PRIORITY_OPTIONS} />
          </Form.Item>
          <Form.Item
            name="status"
            label="Статус"
            rules={[{ required: true, message: 'Выберите статус' }]}
            style={{ minWidth: 200 }}
          >
            <Select options={STATUS_OPTIONS} />
          </Form.Item>
          <Form.Item name="dueDate" label="Срок выполнения">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Space>
        <Form.Item
          name="category"
          label="Категория / тег"
          rules={[{ max: 200, message: 'Не более 200 символов' }]}
        >
          <Input maxLength={200} placeholder="Можно заполнить вручную или через ИИ" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
