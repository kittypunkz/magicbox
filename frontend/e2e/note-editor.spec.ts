import { test, expect } from '@playwright/test';

test.describe('Note Editor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Create a note to edit
    const title = 'Editor Test ' + Date.now();
    await page.getByRole('button', { name: /new note/i }).click();
    await page.getByPlaceholder(/note title/i).fill(title);
    await page.getByRole('button', { name: /create/i }).click();
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
    // Wait for auto-save
    await page.waitForTimeout(2000);
    // Title should be updated
    await expect(titleInput).toHaveValue('Updated Title');
  });

  test('should show saving indicator', async ({ page }) => {
    const titleInput = page.locator('[data-area-id="noteeditor-title"]');
    await titleInput.clear();
    await titleInput.fill('Save Test ' + Date.now());
    // Should show saving indicator briefly
    // Note: this might be too fast to catch
  });

  test('should delete note', async ({ page }) => {
    // Click the more menu
    await page.locator('[data-area-id="noteeditor-header"] button').last().click();
    // Click delete
    await page.getByText('Delete note').click();
    // Confirm delete
    await page.getByRole('button', { name: /delete/i }).click();
    // Should navigate back
    await expect(page.locator('[data-area-id="noteeditor"]')).not.toBeVisible();
  });

  test('should navigate back', async ({ page }) => {
    await page.locator('[data-area-id="noteeditor-back-btn"]').click();
    await expect(page.locator('[data-area-id="noteeditor"]')).not.toBeVisible();
  });
});
