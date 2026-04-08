import type { APIRequestContext, Page } from '@playwright/test';
import type { TaskPayload } from '@/types/task';

export function isTasksListApiUrl(u: string): boolean {
  return u.includes('/api/v1/tasks') && !/\/api\/v1\/tasks\/[^/?]+/.test(u);
}

export async function gotoTasksBoard(page: Page): Promise<void> {
  const listResp = page.waitForResponse(
    (r) =>
      r.request().method() === 'GET' &&
      isTasksListApiUrl(r.url()) &&
      r.ok()
  );
  await page.goto('/tasks');
  await listResp;
}

export async function apiClearTasks(request: APIRequestContext) {
  let page = 1;
  const pageSize = 100;
  while (true) {
    const res = await request.get(
      `/api/v1/tasks?page=${page}&pageSize=${pageSize}`
    );
    if (!res.ok()) return;
    const json = (await res.json()) as {
      data?: { id: string }[];
      total?: number;
    };
    const batch = json.data ?? [];
    for (const t of batch) {
      await request.delete(`/api/v1/tasks/${t.id}`);
    }
    const total = json.total ?? batch.length;
    if (batch.length < pageSize || page * pageSize >= total) break;
    page += 1;
  }
}

export async function apiCreateTask(
  request: APIRequestContext,
  body: TaskPayload
) {
  const res = await request.post('/api/v1/tasks', {
    data: body,
  });
  if (!res.ok()) {
    throw new Error(`createTask failed: ${res.status()} ${await res.text()}`);
  }
  return (await res.json()) as { id: string; title: string };
}
