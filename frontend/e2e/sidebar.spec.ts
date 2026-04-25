import { test, expect } from '@playwright/test';

test.describe('Sidebar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display navigation buttons', async ({ page }) => {
    // Desktop sidebar shows icon-only nav buttons by default (collapsed)
    await expect(page.getByRole('button', { name: /new note/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /tasks/i }).first()).toBeVisible();
  });

  test('should show folder list when expanded', async ({ page }) => {
    await page.getByRole('button', { name: /expand sidebar/i }).click();
    await expect(page.getByRole('button', { name: 'Inbox', exact: true })).toBeVisible();
  });

  test('should navigate to folder', async ({ page }) => {
    await page.getByRole('button', { name: /expand sidebar/i }).click();
    await page.getByRole('button', { name: 'Inbox', exact: true }).click();
    await expect(page.locator('[data-area-id="folderpage-name"]')).toBeVisible();
  });

  test('should navigate to tasks page', async ({ page }) => {
    await page.getByRole('button', { name: /tasks/i }).first().click();
    await expect(page.getByRole('main').getByRole('heading', { name: 'Tasks' })).toBeVisible();
  });

  test('should show search', async ({ page }) => {
    await expect(page.getByPlaceholder('Search notes...')).toBeVisible();
  });

  test('should have new note button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /new note/i }).first()).toBeVisible();
  });
});
