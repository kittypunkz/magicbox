import { test, expect } from '@playwright/test';

test.describe('Folder Page', () => {
  let uniqueNoteTitle = '';

  test.beforeEach(async ({ page }) => {
    uniqueNoteTitle = 'Personal folder note ' + Date.now();
    await page.goto('/');
    
    // Create a note in personal folder
    const input = page.getByPlaceholder("What's on your mind? Use #folder to organize");
    await input.fill('#personal ' + uniqueNoteTitle);
    await input.press('Enter'); // Single enter works now because space hides suggestions
    
    // Wait for editor
    await expect(page.getByPlaceholder('Note title')).toBeVisible();
    
    // Go to the folder page via sidebar to be sure
    const sidebar = page.locator('[data-area-id="sidebar"]');
    await sidebar.getByText('personal').first().click();
    
    // Ensure we are on the folder page
    await expect(page.locator('[data-area-id="folderpage-name"]')).toContainText('personal');
  });

  test('should display folder header', async ({ page }) => {
    await expect(page.locator('[data-area-id="folderpage-name"]')).toContainText('personal');
    await expect(page.locator('[data-area-id="folderpage-count"]')).toContainText(/note/);
  });

  test('should display notes in folder', async ({ page }) => {
    // Should show the note we created
    await expect(page.getByText(uniqueNoteTitle).first()).toBeVisible();
  });

  test('should open note from folder', async ({ page }) => {
    await page.getByText(uniqueNoteTitle).first().click();

    // Should open note editor
    await expect(page.getByPlaceholder('Note title')).toHaveValue(uniqueNoteTitle);
  });

  test('should show empty state for empty folder', async ({ page }) => {
    // Create an empty folder
    const emptyFolderName = 'empty' + Date.now();
    await page.locator('.sidebar-all-notes-btn').click();
    const input = page.getByPlaceholder("What's on your mind? Use #folder to organize");
    await input.fill(`Dummy note #${emptyFolderName} `); // Add space to hide suggestions
    await input.press('Enter');
    await expect(page.getByPlaceholder('Note title')).toBeVisible();
    
    // Delete the only note in it
    await page.locator('button').filter({ has: page.locator('svg[class*="lucide-more-vertical"]') }).click();
    await page.getByText('Delete note').click();
    await page.locator('[data-area-id="confirm-modal-confirm"]').click();
    
    // Sidebar should have the folder
    await page.locator('[data-area-id="sidebar"]').getByText(emptyFolderName).first().click();
    
    await expect(page.locator('[data-area-id="folderpage-name"]')).toContainText(emptyFolderName);
    await expect(page.getByText('No notes in this folder')).toBeVisible();
  });

  test('should delete note from folder', async ({ page }) => {
    // Hover over note to show delete button
    const noteCard = page.locator(`[data-area-id^="folderpage-note-"]`).filter({ hasText: uniqueNoteTitle }).first();
    await noteCard.hover();

    // Click delete button
    await noteCard.locator('[data-area-id*="delete"]').click();

    // Confirm modal
    await expect(page.getByText('Delete Note')).toBeVisible();
    await page.locator('[data-area-id="confirm-modal-confirm"]').click();

    // Note should be removed from the list
    const noteTitleInList = page.locator('[data-area-id^="folderpage-note-title-"]').filter({ hasText: uniqueNoteTitle });
    await expect(noteTitleInList).not.toBeVisible();
  });
});
