import { test, expect } from '@playwright/test';

test.describe('Tasks', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tasks');
  });

  test('should display tasks page', async ({ page }) => {
    await expect(page.getByRole('main').getByRole('heading', { name: 'Tasks' })).toBeVisible();
  });

  test('should create a new task', async ({ page }) => {
    const title = 'E2E Task ' + Date.now();
    // Click "Add task" in the Backlog column
    await page.getByText(/add task/i).first().click();
    await page.getByPlaceholder(/task title/i).fill(title);
    await page.keyboard.press('Enter');
    await expect(page.getByText(title)).toBeVisible();
  });

  test('should toggle between Board and Summary views', async ({ page }) => {
    // Switch to Summary view using the title attribute button
    await page.getByTitle('Summary').click();
    // Summary view renders a different section
    await expect(page.getByText(/backlog|doing|done today/i).first()).toBeVisible();
    // Switch back to Board
    await page.getByTitle('Board').click();
    await expect(page.getByText('Backlog')).toBeVisible();
  });
});
