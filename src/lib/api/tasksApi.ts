import axios from 'axios';
import type {
  LlmCategoryResponseBody,
  LlmDecomposeResponseBody,
  LlmPriorityResponseBody,
  LlmSuggestPriorityRequestBody,
  LlmTaskTitleBody,
} from '@/types/llm';
import type { ApiErrorMessageBody } from '@/types/axiosErrorBody';
import type {
  Task,
  TaskFilters,
  TaskListResponse,
  TaskPayload,
} from '@/types/task';

const client = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

function buildQuery(f: TaskFilters): string {
  const p = new URLSearchParams();
  if (f.status) p.set('status', f.status);
  if (f.priority) p.set('priority', f.priority);
  if (f.q?.trim()) p.set('q', f.q.trim());
  if (f.dueFrom) p.set('dueFrom', f.dueFrom);
  if (f.dueTo) p.set('dueTo', f.dueTo);
  if (f.overdue) p.set('overdue', 'true');
  if (f.page != null) p.set('page', String(f.page));
  if (f.pageSize != null) p.set('pageSize', String(f.pageSize));
  if (f.sortBy) p.set('sortBy', f.sortBy);
  if (f.sortOrder) p.set('sortOrder', f.sortOrder);
  const qs = p.toString();
  return qs ? `?${qs}` : '';
}

export async function fetchTasks(f: TaskFilters): Promise<TaskListResponse> {
  const { data } = await client.get<TaskListResponse>(`/tasks${buildQuery(f)}`);
  return data;
}

export async function getTask(id: string): Promise<Task> {
  const { data } = await client.get<Task>(`/tasks/${id}`);
  return data;
}

export async function createTask(payload: TaskPayload): Promise<Task> {
  const { data } = await client.post<Task>(`/tasks`, payload);
  return data;
}

export async function updateTask(
  id: string,
  patch: Partial<TaskPayload>
): Promise<Task> {
  const { data } = await client.put<Task>(`/tasks/${id}`, patch);
  return data;
}

export async function deleteTask(id: string): Promise<void> {
  await client.delete(`/tasks/${id}`);
}

export async function llmSuggestCategory(body: LlmTaskTitleBody) {
  const { data } = await client.post<LlmCategoryResponseBody>(
    '/llm/suggest-category',
    body
  );
  return data;
}

export async function llmDecompose(body: LlmTaskTitleBody) {
  const { data } = await client.post<LlmDecomposeResponseBody>(
    '/llm/decompose',
    body
  );
  return data;
}

export async function llmSuggestPriority(body: LlmSuggestPriorityRequestBody) {
  const { data } = await client.post<LlmPriorityResponseBody>(
    '/llm/suggest-priority',
    body
  );
  return data;
}

export async function llmWorkloadSummary() {
  const { data } = await client.post<{ summary: string }>(
    '/llm/workload-summary',
    {}
  );
  return data;
}

export async function llmWorkloadSummaryStream(
  onChunk: (text: string) => void,
  options?: { signal?: AbortSignal }
): Promise<void> {
  const res = await fetch('/api/v1/llm/workload-summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stream: true }),
    signal: options?.signal,
  });

  if (!res.ok) {
    let msg = res.statusText;
    try {
      const text = await res.text();
      const j = JSON.parse(text) as ApiErrorMessageBody;
      msg = (j?.error?.message ?? text) || msg;
    } catch {}
    throw new Error(msg);
  }

  if (!res.body) {
    throw new Error('Пустой ответ сервера');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      onChunk(decoder.decode(value, { stream: true }));
    }
    const tail = decoder.decode();
    if (tail) onChunk(tail);
  } finally {
    reader.releaseLock();
  }
}
