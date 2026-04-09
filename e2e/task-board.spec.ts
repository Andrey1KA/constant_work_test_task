import { test, expect } from '@playwright/test';
import { apiClearTasks, apiCreateTask, gotoTasksBoard, isTasksListApiUrl } from './helpers';

test.describe('Интеллектуальный менеджер задач', () => {
  test.beforeEach(async ({ request }) => {
    await apiClearTasks(request);
  });

  test('US-1: создать, отредактировать и удалить задачу', async ({ page }) => {
    const title = `E2E-CRUD-${Date.now()}`;
    const titleEdited = `${title}-edited`;

    await gotoTasksBoard(page);
    await expect(page.getByRole('heading', { name: 'Задачи' })).toBeVisible();

    await page.getByTestId('e2e-btn-new-task').click();
    const dialog = page.getByRole('dialog', { name: 'Новая задача' });
    await expect(dialog).toBeVisible();
    await dialog.getByTestId('e2e-input-task-title').fill(title);
    await dialog.getByTestId('e2e-modal-task-ok').click();
    await expect(dialog).toBeHidden({ timeout: 15_000 });

    const rowCreated = page.getByRole('row', { name: new RegExp(title) });
    await expect(rowCreated).toBeVisible({ timeout: 10_000 });

    const idAttr = await rowCreated.getAttribute('data-testid');
    expect(idAttr).toMatch(/^e2e-task-row-/);
    const taskId = idAttr!.replace('e2e-task-row-', '');

    await page.getByTestId(`e2e-task-edit-${taskId}`).click();
    const editDialog = page.getByRole('dialog', { name: 'Редактирование задачи' });
    await expect(editDialog).toBeVisible();
    await editDialog.getByTestId('e2e-input-task-title').fill(titleEdited);

    await Promise.all([
      page.waitForResponse(
        (r) =>
          r.request().method() === 'PUT' &&
          r.url().includes(`/api/v1/tasks/${taskId}`) &&
          r.status() === 200,
        { timeout: 15_000 }
      ),
      editDialog.getByTestId('e2e-modal-task-ok').click(),
    ]);

    await expect(editDialog).toBeHidden({ timeout: 15_000 });

    await expect(page.getByTestId(`e2e-task-row-${taskId}`)).toContainText(titleEdited, {
      timeout: 15_000,
    });

    await page.getByTestId(`e2e-task-delete-${taskId}`).click();
    await page
      .locator('.ant-popconfirm')
      .filter({ visible: true })
      .getByRole('button', { name: 'Да' })
      .click();
    await expect(page.getByRole('row', { name: new RegExp(titleEdited) })).toHaveCount(0, {
      timeout: 15_000,
    });
  });

  test('US-2: фильтр по статусу и поиск комбинируются в запросе API', async ({
    page,
    request,
  }) => {
    const marker = `e2e-magic-${Date.now()}`;
    await apiCreateTask(request, {
      title: `Alpha ${marker}`,
      description: 'd1',
      priority: 'HIGH',
      status: 'DONE',
    });
    await apiCreateTask(request, {
      title: 'Beta other',
      description: marker,
      priority: 'LOW',
      status: 'PENDING',
    });

    const initialList = page.waitForResponse((r) => {
      return r.request().method() === 'GET' && isTasksListApiUrl(r.url());
    });
    await page.goto('/tasks');
    await initialList;

    await page.getByTestId('e2e-filter-status').click();
    const statusDoneResponse = page.waitForResponse((r) => {
      if (r.request().method() !== 'GET' || !isTasksListApiUrl(r.url())) return false;
      try {
        return new URL(r.url()).searchParams.get('status') === 'DONE';
      } catch {
        return false;
      }
    });
    await page
      .locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)')
      .locator('.ant-select-item-option-content')
      .filter({ hasText: /^Готово$/ })
      .click();
    await statusDoneResponse;
    await expect(
      page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)')
    ).toHaveCount(0);

    const requestPromise = page.waitForRequest((r) => {
      if (r.method() !== 'GET') return false;
      const u = r.url();
      if (!isTasksListApiUrl(u)) return false;
      try {
        const url = new URL(u);
        return (
          url.searchParams.get('status') === 'DONE' &&
          url.searchParams.get('q') === marker
        );
      } catch {
        return false;
      }
    });

    const searchInput = page.getByPlaceholder('Поиск по названию и описанию');
    await searchInput.fill(marker);
    await searchInput.press('Enter');

    const req = await requestPromise;
    expect(new URL(req.url()).searchParams.get('status')).toBe('DONE');
    expect(new URL(req.url()).searchParams.get('q')).toBe(marker);

    await expect(page.getByRole('row', { name: new RegExp(`Alpha ${marker}`) })).toBeVisible();
    await expect(page.getByRole('row', { name: /Beta other/ })).toHaveCount(0);
  });

  test('US-3: категория ИИ — предложение, отклонить и принять', async ({ page }) => {
    const title = `E2E-CAT-${Date.now()}`;
    await gotoTasksBoard(page);
    await page.getByTestId('e2e-btn-new-task').click();
    const newDlg = page.getByRole('dialog', { name: 'Новая задача' });
    await expect(newDlg).toBeVisible();
    await newDlg.getByTestId('e2e-input-task-title').fill(title);
    await newDlg.getByTestId('e2e-modal-task-ok').click();
    await expect(newDlg).toBeHidden({ timeout: 15_000 });

    const row = page.getByRole('row', { name: new RegExp(title) });
    const idAttr = await row.getAttribute('data-testid');
    const id = idAttr!.replace('e2e-task-row-', '');

    await page.getByTestId(`e2e-task-ai-${id}`).click();
    await page.locator('.ant-dropdown:not(.ant-dropdown-hidden)').getByText('Предложить категорию').click();

    const catModal = page.getByRole('dialog', { name: 'Предложить категорию (ИИ)' });
    await expect(catModal).toBeVisible();
    await expect(catModal.getByText(/Предложение:|Демо/i)).toBeVisible({ timeout: 20_000 });

    await catModal.getByTestId('e2e-cat-reject').click();
    await expect(catModal).toBeHidden();

    await page.getByTestId(`e2e-task-ai-${id}`).click();
    await page.locator('.ant-dropdown:not(.ant-dropdown-hidden)').getByText('Предложить категорию').click();
    const catModal2 = page.getByRole('dialog', { name: 'Предложить категорию (ИИ)' });
    await expect(catModal2).toBeVisible();
    await expect(catModal2.getByText(/Предложение:|Демо/i)).toBeVisible({ timeout: 20_000 });

    await catModal2.getByTestId('e2e-cat-accept').click();
    await expect(catModal2).toBeHidden({ timeout: 15_000 });
    await expect(page.locator(`[data-testid="e2e-task-row-${id}"]`)).toContainText(
      /Демо|общее/i
    );
  });

  test('US-4: декомпозиция — редактирование подзадач и создать', async ({ page }) => {
    const title = `E2E-DEC-${Date.now()}`;
    await gotoTasksBoard(page);
    await page.getByTestId('e2e-btn-new-task').click();
    const newDlg = page.getByRole('dialog', { name: 'Новая задача' });
    await expect(newDlg).toBeVisible();
    await newDlg.getByTestId('e2e-input-task-title').fill(title);
    await newDlg.getByTestId('e2e-modal-task-ok').click();
    await expect(newDlg).toBeHidden({ timeout: 15_000 });

    const row = page.getByRole('row', { name: new RegExp(title) });
    const idAttr = await row.getAttribute('data-testid');
    const id = idAttr!.replace('e2e-task-row-', '');

    await page.getByTestId(`e2e-task-ai-${id}`).click();
    await page.locator('.ant-dropdown:not(.ant-dropdown-hidden)').getByText('Разбить на подзадачи').click();

    const decModal = page.getByRole('dialog', { name: 'Разбить на подзадачи (ИИ)' });
    await expect(decModal).toBeVisible();
    await expect(decModal.getByTestId('e2e-dec-input-0')).toBeVisible({ timeout: 20_000 });

    await decModal.getByTestId('e2e-dec-input-0').fill(`Подзадача-правка-${Date.now()}`);

    await decModal.getByTestId('e2e-dec-create').click();
    await expect(decModal).toBeHidden({ timeout: 20_000 });
    await expect(page.getByText('Подзадача-правка', { exact: false }).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test('US-5: приоритет ИИ — применить', async ({ page }) => {
    const title = `E2E-PRI-${Date.now()}`;
    await gotoTasksBoard(page);
    await page.getByTestId('e2e-btn-new-task').click();
    const newDlg = page.getByRole('dialog', { name: 'Новая задача' });
    await expect(newDlg).toBeVisible();
    await newDlg.getByTestId('e2e-input-task-title').fill(title);
    await newDlg.getByTestId('e2e-modal-task-ok').click();
    await expect(newDlg).toBeHidden({ timeout: 15_000 });

    const row = page.getByRole('row', { name: new RegExp(title) });
    const idAttr = await row.getAttribute('data-testid');
    const id = idAttr!.replace('e2e-task-row-', '');

    await page.getByTestId(`e2e-task-ai-${id}`).click();
    await page.locator('.ant-dropdown:not(.ant-dropdown-hidden)').getByText('Предложить приоритет').click();

    const priModal = page.getByRole('dialog', { name: 'Предложить приоритет (ИИ)' });
    await expect(priModal).toBeVisible();
    await expect(priModal.getByTestId('e2e-pri-apply')).toBeVisible({ timeout: 20_000 });

    await priModal.getByTestId('e2e-pri-apply').click();
    await expect(priModal).toBeHidden({ timeout: 15_000 });
  });

  test('US-6: сводка нагрузки — модалка с текстом', async ({ page }) => {
    await gotoTasksBoard(page);
    await page.getByTestId('e2e-btn-workload').click();

    const sumModal = page.getByRole('dialog', { name: 'Сводка нагрузки' });
    await expect(sumModal).toBeVisible({ timeout: 15_000 });

    await expect(sumModal.getByTestId('e2e-summary-text')).toBeVisible({ timeout: 25_000 });
    const text = await sumModal.getByTestId('e2e-summary-text').innerText();
    expect(text.length).toBeGreaterThan(20);

    await sumModal.getByTestId('e2e-summary-close').click();
    await expect(sumModal).toBeHidden();
  });
});
