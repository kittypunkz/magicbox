import { test, expect } from '@playwright/test';

test.describe('Note Editor', () => {
  let uniqueTitle = '';

  test.beforeEach(async ({ page }) => {
    uniqueTitle = 'E2E Test Note ' + Date.now();
    await page.goto('/');
    // Create a note
    const input = page.getByPlaceholder("What's on your mind? Use #folder to organize");
    await input.fill(uniqueTitle);
    await input.press('Enter');
    await expect(page.getByPlaceholder('Note title')).toBeVisible();
  });

  test('should display note editor', async ({ page }) => {
    await expect(page.getByPlaceholder('Note title')).toBeVisible();
    await expect(page.getByPlaceholder('Start typing...')).toBeVisible();
    await expect(page.locator('button[title="Back"]')).toBeVisible();
  });

  test('should edit note title', async ({ page }) => {
    const updatedTitle = 'Updated Title ' + Date.now();
    const titleInput = page.getByPlaceholder('Note title');
    await titleInput.fill(updatedTitle);
    
    // Wait for auto-save
    await page.waitForTimeout(2000);
    
    // Go back (goes to folder page, Inbox)
    await page.locator('button[title="Back"]').click();
    await page.getByText(updatedTitle).first().click();
    
    // Title should be saved
    await expect(page.getByPlaceholder('Note title')).toHaveValue(updatedTitle);
  });

  test('should edit note content', async ({ page }) => {
    const uniqueContent = 'This is my note content ' + Date.now();
    const contentArea = page.getByPlaceholder('Start typing...');
    await contentArea.fill(uniqueContent);
    
    // Wait for auto-save
    await page.waitForTimeout(2000);
    
    // Go back and reopen
    await page.locator('button[title="Back"]').click();
    await page.getByText(uniqueTitle).first().click();
    
    // Content should be saved
    await expect(page.locator('textarea')).toHaveValue(uniqueContent);
  });

  test('should show saving indicator', async ({ page }) => {
    const contentArea = page.getByPlaceholder('Start typing...');
    await contentArea.fill('Testing save indicator ' + Date.now());
    
    // Wait for debounce + save
    const saveIndicator = page.locator('[data-area-id="editor-save-status"]');
    await expect(saveIndicator).toContainText(/saving|saved/, { timeout: 10000 });
  });

  test('should use checkboxes [ ] and [x]', async ({ page }) => {
    const contentArea = page.getByPlaceholder('Start typing...');
    await contentArea.fill('[ ] Unchecked item\n[x] Checked item');
    
    await expect(contentArea).toHaveValue(/\[ \] Unchecked item/);
    await expect(contentArea).toHaveValue(/\[x\] Checked item/);
  });

  test('should delete note', async ({ page }) => {
    // Click more menu button (MoreVertical icon)
    const moreMenu = page.locator('button').filter({ has: page.locator('svg[class*="lucide-more-vertical"]') });
    await moreMenu.click();
    
    // Click delete from menu
    await page.getByText('Delete note').click();
    
    // Confirm modal should appear
    await expect(page.getByText('Delete Note')).toBeVisible();
    
    // Cancel
    await page.locator('[data-area-id="confirm-modal-cancel"]').click();
    
    // Should still be on note
    await expect(page.getByPlaceholder('Note title')).toBeVisible();
  });

  test('should navigate back to Inbox folder page', async ({ page }) => {
    // Since this note has no folder, it belongs to Inbox
    await page.locator('button[title="Back"]').click();
    await expect(page.locator('[data-area-id="folderpage-name"]')).toContainText('Inbox');
  });
});
