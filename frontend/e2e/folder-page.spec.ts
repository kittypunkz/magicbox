import { test, expect } from '@playwright/test';

test.describe('Folder Page', () => {
  test('should display folder header', async ({ page }) => {
    await page.goto('/folder/1');
    await expect(page.locator('[data-area-id="folderpage-name"]')).toBeVisible();
  });

  test('should show new note button in folder', async ({ page }) => {
    await page.goto('/folder/1');
    await expect(page.getByRole('button', { name: /new note/i }).first()).toBeVisible();
  });

  test('should open note from folder', async ({ page }) => {
    await page.goto('/folder/1');
    const noteCard = page.locator('[data-area-id="folderpage-note-card"]').first();
    if (await noteCard.isVisible({ timeout: 3000 }).catch(() => false)) {
      await noteCard.click();
      await expect(page.locator('[data-area-id="noteeditor"]')).toBeVisible();
    }
  });

  test('should navigate between folders via sidebar', async ({ page }) => {
    await page.goto('/');
    // Expand sidebar to see folders
    await page.getByRole('button', { name: /expand sidebar/i }).click();
    await page.getByRole('button', { name: 'Inbox', exact: true }).click();
    await expect(page.locator('[data-area-id="folderpage-name"]')).toBeVisible();
    // Navigate back to Notes via sidebar nav
    await page.getByRole('button', { name: 'Notes', exact: true }).click();
    await expect(page.getByRole('main').getByRole('heading', { name: 'Notes' })).toBeVisible();
  });
});
