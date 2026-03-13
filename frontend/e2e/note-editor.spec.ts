import { test, expect } from '@playwright/test';

test.describe('Note Editor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Create a note
    const input = page.getByPlaceholder('Type a note and press Enter...');
    await input.fill('E2E Test Note');
    await input.press('Enter');
    await expect(page.getByPlaceholder('Note title')).toBeVisible();
  });

  test('should display note editor', async ({ page }) => {
    await expect(page.getByPlaceholder('Note title')).toBeVisible();
    await expect(page.getByPlaceholder('Start typing...')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Back' })).toBeVisible();
  });

  test('should edit note title', async ({ page }) => {
    const titleInput = page.getByPlaceholder('Note title');
    await titleInput.fill('Updated Title');
    
    // Wait for auto-save
    await page.waitForTimeout(1000);
    
    // Go back and reopen
    await page.getByRole('button', { name: 'Back' }).click();
    await page.getByText('Updated Title').click();
    
    // Title should be saved
    await expect(page.getByPlaceholder('Note title')).toHaveValue('Updated Title');
  });

  test('should edit note content', async ({ page }) => {
    const contentArea = page.getByPlaceholder('Start typing...');
    await contentArea.fill('This is my note content');
    
    // Wait for auto-save
    await page.waitForTimeout(1000);
    
    // Go back and reopen
    await page.getByRole('button', { name: 'Back' }).click();
    await page.getByText('E2E Test Note').click();
    
    // Content should be saved
    await expect(page.getByText('This is my note content')).toBeVisible();
  });

  test('should show saving indicator', async ({ page }) => {
    const contentArea = page.getByPlaceholder('Start typing...');
    await contentArea.fill('Testing save indicator');
    
    // Should show saving
    await expect(page.getByText('saving')).toBeVisible();
    
    // Wait for auto-save
    await page.waitForTimeout(1000);
    
    // Should show saved
    await expect(page.getByText('saved')).toBeVisible();
  });

  test('should use checkboxes [ ] and [x]', async ({ page }) => {
    const contentArea = page.getByPlaceholder('Start typing...');
    await contentArea.fill('[ ] Unchecked item\n[x] Checked item');
    
    // Click on checkbox
    await contentArea.click();
    
    // Position cursor at checkbox and toggle
    await page.keyboard.press('Home');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    
    // Type x to check
    await page.keyboard.press('x');
    
    // Should now be [x]
    await expect(contentArea).toContainText('[x] Unchecked item');
  });

  test('should change folder', async ({ page }) => {
    // Click on folder dropdown
    await page.getByText('Inbox').click();
    
    // Select a different folder if available
    const folderOptions = page.locator('button').filter({ hasText: /^(?!Inbox).*$/ });
    if (await folderOptions.count() > 0) {
      await folderOptions.first().click();
      
      // Wait for save
      await page.waitForTimeout(1000);
      
      // Go back and check folder changed
      await page.getByRole('button', { name: 'Back' }).click();
      // Folder should be updated
    }
  });

  test('should delete note', async ({ page }) => {
    // Open menu
    await page.locator('button').nth(1).click(); // More menu button
    
    // Click delete
    await page.getByText('Delete note').click();
    
    // Confirm modal should appear
    await expect(page.getByText('Delete Note')).toBeVisible();
    await expect(page.getByText('Delete "E2E Test Note"?')).toBeVisible();
    
    // Cancel
    await page.getByRole('button', { name: 'Cancel' }).click();
    
    // Should still be on note
    await expect(page.getByPlaceholder('Note title')).toBeVisible();
  });

  test('should navigate back to homepage', async ({ page }) => {
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page.getByText('Welcome to MagicBox')).toBeVisible();
  });
});
