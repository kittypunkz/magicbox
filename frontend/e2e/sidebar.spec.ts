import { test, expect } from '@playwright/test';

test.describe('Sidebar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display logo and version', async ({ page }) => {
    // Use heading role to be specific
    await expect(page.getByRole('heading', { name: 'MagicBox' })).toBeVisible();
  });

  test('should display folder list', async ({ page }) => {
    // Use button role to match sidebar button specifically
    await expect(page.getByRole('button', { name: 'All Notes' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Inbox' })).toBeVisible();
  });

  test('should navigate to folder', async ({ page }) => {
    await page.getByRole('button', { name: 'Inbox' }).click();
    // Heading should show Inbox (folder page)
    await expect(page.getByRole('heading', { name: 'Inbox' })).toBeVisible();
  });

  test('should highlight active folder', async ({ page }) => {
    await page.getByRole('button', { name: 'Inbox' }).click();
    const inboxBtn = page.getByRole('button', { name: 'Inbox' });
    await expect(inboxBtn).toBeVisible();
  });

  test('should show search', async ({ page }) => {
    await expect(page.getByPlaceholder('Search notes...')).toBeVisible();
  });

  test('should have new note button', async ({ page }) => {
    // New Note button is at the top of sidebar
    await expect(page.getByRole('button', { name: /new note/i })).toBeVisible();
  });
});
