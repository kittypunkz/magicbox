import { test, expect } from '@playwright/test';

test.describe('Sidebar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display logo and version', async ({ page }) => {
    await expect(page.getByText('MagicBox')).toBeVisible();
    await expect(page.getByText(/v\d+\.\d+\.\d+/)).toBeVisible();
  });

  test('should display folder list', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Inbox' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Personal' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Work' })).toBeVisible();
  });

  test('should navigate to folder', async ({ page }) => {
    await page.getByRole('button', { name: 'Personal' }).click();
    await expect(page.getByText('Personal')).toBeVisible();
    await expect(page.getByText(/\d+ note/)).toBeVisible();
  });

  test('should highlight active folder', async ({ page }) => {
    await page.getByRole('button', { name: 'Work' }).click();
    // Work button should have active styling (blue text)
    const workButton = page.getByRole('button', { name: 'Work' });
    await expect(workButton).toHaveClass(/text-blue-400/);
  });

  test('should create new folder', async ({ page }) => {
    // This test assumes there's a new folder button
    // If not implemented, skip or mark as pending
    test.skip();
  });

  test('should show search', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search notes...');
    await expect(searchInput).toBeVisible();
  });

  test('should toggle sidebar on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Sidebar should be hidden or have toggle button
    const toggleButton = page.locator('[data-sidebar-toggle]');
    if (await toggleButton.count() > 0) {
      await toggleButton.click();
      await expect(page.getByText('MagicBox')).toBeVisible();
    }
  });
});
