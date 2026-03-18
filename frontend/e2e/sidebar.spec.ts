import { test, expect } from '@playwright/test';

test.describe('Sidebar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Create folders to ensure they exist
    const input = page.getByPlaceholder("What's on your mind? Use #folder to organize");
    await input.fill('Initial note #personal '); // Add space to hide suggestions
    await input.press('Enter');
    await expect(page.getByPlaceholder('Note title')).toBeVisible();
    await page.locator('.sidebar-all-notes-btn').click(); // Go back to Home
    
    await expect(input).toBeVisible(); // Ensure we are back on home
    await input.fill('Work note #work '); // Add space to hide suggestions
    await input.press('Enter');
    await expect(page.getByPlaceholder('Note title')).toBeVisible();
    await page.locator('.sidebar-all-notes-btn').click(); // Go back to Home
  });

  test('should display logo and version', async ({ page }) => {
    await expect(page.locator('[data-area-id="sidebar"]').getByText('MagicBox')).toBeVisible();
    await expect(page.getByText(/v\d+\.\d+\.\d+/)).toBeVisible();
  });

  test('should display folder list', async ({ page }) => {
    const sidebar = page.locator('[data-area-id="sidebar"]');
    await expect(sidebar.getByText('All Notes')).toBeVisible();
    await expect(page.locator('[data-area-id="sidebar-folders-header"]').getByText('Folders')).toBeVisible();
    await expect(sidebar.getByText('Inbox')).toBeVisible();
    await expect(sidebar.getByText('personal').first()).toBeVisible();
    await expect(sidebar.getByText('work').first()).toBeVisible();
  });

  test('should navigate to folder', async ({ page }) => {
    const sidebar = page.locator('[data-area-id="sidebar"]');
    await sidebar.getByText('personal').first().click();
    await expect(page.locator('[data-area-id="folderpage-name"]')).toContainText('personal');
  });

  test('should highlight active folder', async ({ page }) => {
    await page.locator('.sidebar-all-notes-btn').click();
    await expect(page.locator('.sidebar-all-notes-btn')).toHaveClass(/bg-\[#2a2a2a\]/);
  });

  test('should show search', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search notes and folders...');
    await expect(searchInput).toBeVisible();
  });
});
