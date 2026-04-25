import { test, expect } from '@playwright/test';

test.describe('Tasks', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tasks');
  });

  test('should display tasks page', async ({ page }) => {
    await expect(page.locator('[data-area-id="tasks-page"]')).toBeVisible();
  });

  test('should create a new task', async ({ page }) => {
    const title = 'E2E Task ' + Date.now();

    await page.getByRole('button', { name: /new task|add task/i }).click();
    await page.getByPlaceholder(/task/i).fill(title);
    await page.keyboard.press('Enter');

    await expect(page.getByText(title)).toBeVisible();
  });

  test('should toggle between Board and Summary views', async ({ page }) => {
    const summaryBtn = page.getByRole('button', { name: /summary/i });
    const boardBtn = page.getByRole('button', { name: /board/i });

    if (await summaryBtn.isVisible()) {
      await summaryBtn.click();
      await expect(page.locator('[data-area-id="summary-view"]')).toBeVisible();
      await boardBtn.click();
    }
  });
});
