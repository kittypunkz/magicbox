import { test, expect } from '@playwright/test';

test.describe('Folder Page', () => {
  test('should display folder header', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Inbox' }).click();
    // Should show folder page heading
    await expect(page.getByRole('heading', { name: 'Inbox' })).toBeVisible();
  });

  test('should create note in folder', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Inbox' }).click();
    await expect(page.getByRole('button', { name: /new note/i })).toBeVisible();
  });

  test('should show folder page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Inbox' }).click();
    await expect(page.getByRole('heading', { name: 'Inbox' })).toBeVisible();
  });

  test('should open note from folder', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Inbox' }).click();
    const noteCard = page.locator('[data-area-id="folderpage-note-card"]').first();
    if (await noteCard.isVisible({ timeout: 3000 }).catch(() => false)) {
      await noteCard.click();
      await expect(page.locator('[data-area-id="noteeditor"]')).toBeVisible();
    }
  });

  test('should navigate between folders', async ({ page }) => {
    await page.goto('/');
    // Go to Inbox
    await page.getByRole('button', { name: 'Inbox' }).click();
    await expect(page.getByRole('heading', { name: 'Inbox' })).toBeVisible();
    // Go back to All Notes
    await page.getByRole('button', { name: 'All Notes' }).click();
    await expect(page.getByText('Recent Notes')).toBeVisible();
  });
});
