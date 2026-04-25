import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display notes page heading', async ({ page }) => {
    await expect(page.getByRole('main').getByRole('heading', { name: 'Notes' })).toBeVisible();
  });

  test('should display new note button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /new note/i }).first()).toBeVisible();
  });

  test('should open create note modal', async ({ page }) => {
    await page.getByRole('button', { name: /new note/i }).first().click();
    await expect(page.getByPlaceholder(/note title/i)).toBeVisible();
  });

  test('should create a new note', async ({ page }) => {
    const title = 'E2E Test Note ' + Date.now();
    await page.getByRole('button', { name: /new note/i }).first().click();
    await page.getByPlaceholder(/note title/i).fill(title);
    await page.getByRole('button', { name: /create note/i }).click();
    await expect(page.locator('[data-area-id="noteeditor"]')).toBeVisible();
  });

  test('should open note from cards', async ({ page }) => {
    // Only run if notes exist
    const noteCard = page.locator('.grid a, [class*="NoteCard"], [class*="note-card"]').first();
    if (await noteCard.isVisible({ timeout: 2000 }).catch(() => false)) {
      await noteCard.click();
      await expect(page.locator('[data-area-id="noteeditor"]')).toBeVisible();
    }
  });
});
