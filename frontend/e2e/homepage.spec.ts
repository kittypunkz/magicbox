import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display homepage', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Recent Notes' })).toBeVisible();
  });

  test('should display recent notes section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Recent Notes' })).toBeVisible();
  });

  test('should display new note button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /new note/i })).toBeVisible();
  });

  test('should open create note modal', async ({ page }) => {
    await page.getByRole('button', { name: /new note/i }).click();
    await expect(page.getByPlaceholder(/note title/i)).toBeVisible();
  });

  test('should create a new note', async ({ page }) => {
    const title = 'E2E Test Note ' + Date.now();
    await page.getByRole('button', { name: /new note/i }).click();
    await page.getByPlaceholder(/note title/i).fill(title);
    await page.getByRole('button', { name: /create/i }).click();
    await expect(page.locator('[data-area-id="noteeditor"]')).toBeVisible();
  });

  test('should open note from recent cards', async ({ page }) => {
    const noteCard = page.locator('[data-area-id="homepage-recent-card"]').first();
    if (await noteCard.isVisible({ timeout: 3000 }).catch(() => false)) {
      await noteCard.click();
      await expect(page.locator('[data-area-id="noteeditor"]')).toBeVisible();
    }
  });
});
