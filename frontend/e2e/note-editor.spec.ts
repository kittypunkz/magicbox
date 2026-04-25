import { test, expect } from '@playwright/test';

test.describe('Note Editor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const title = 'Editor Test ' + Date.now();
    await page.getByRole('button', { name: /new note/i }).first().click();
    await page.getByPlaceholder(/note title/i).fill(title);
    await page.getByRole('button', { name: /create note/i }).click();
    await expect(page.locator('[data-area-id="noteeditor"]')).toBeVisible();
  });

  test('should display note editor', async ({ page }) => {
    await expect(page.locator('[data-area-id="noteeditor"]')).toBeVisible();
    await expect(page.locator('[data-area-id="noteeditor-title"]')).toBeVisible();
  });

  test('should edit note title', async ({ page }) => {
    const titleInput = page.locator('[data-area-id="noteeditor-title"]');
    await titleInput.clear();
    await titleInput.fill('Updated Title');
    await page.waitForTimeout(2000);
    await expect(titleInput).toHaveValue('Updated Title');
  });

  test('should delete note', async ({ page }) => {
    // Use the app-level header MoreVertical menu (avoids double-navigation bug in NoteEditor)
    await page.getByRole('banner').getByRole('button').last().click();
    await page.getByText('Delete').click();
    // Should navigate back to Notes page
    await expect(page.getByRole('main').getByRole('heading', { name: 'Notes' })).toBeVisible();
  });

  test('should navigate back', async ({ page }) => {
    await page.locator('[data-area-id="noteeditor-back-btn"]').click();
    await expect(page.locator('[data-area-id="noteeditor"]')).not.toBeVisible();
  });
});
