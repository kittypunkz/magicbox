import { test, expect } from '@playwright/test';

test.describe('Folder Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Create a note in Personal folder
    const input = page.getByPlaceholder("What's on your mind? Use #folder to organize");
    await input.fill('#personal Personal folder note');
    await input.press('Enter');
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Back' }).click();
  });

  test('should display folder header', async ({ page }) => {
    await page.getByRole('button', { name: 'Personal' }).click();
    await expect(page.getByText('Personal')).toBeVisible();
    await expect(page.getByText(/\d+ note/)).toBeVisible();
  });

  test('should display notes in folder', async ({ page }) => {
    await page.getByRole('button', { name: 'Personal' }).click();
    
    // Should show the note we created
    await expect(page.getByText('Personal folder note')).toBeVisible();
  });

  test('should open note from folder', async ({ page }) => {
    await page.getByRole('button', { name: 'Personal' }).click();
    await page.getByText('Personal folder note').click();
    
    // Should open note editor
    await expect(page.getByPlaceholder('Note title')).toHaveValue('Personal folder note');
  });

  test('should show empty state for empty folder', async ({ page }) => {
    // Navigate to a folder with no notes
    await page.getByRole('button', { name: 'Work' }).click();
    
    // Should show empty message
    await expect(page.getByText('No notes in this folder')).toBeVisible();
  });

  test('should delete note from folder', async ({ page }) => {
    await page.getByRole('button', { name: 'Personal' }).click();
    
    // Hover over note to show delete button
    const noteCard = page.getByText('Personal folder note').locator('..').locator('..');
    await noteCard.hover();
    
    // Click delete
    await page.locator('[data-area-id*="delete"]').first().click();
    
    // Confirm modal
    await expect(page.getByText('Delete Note')).toBeVisible();
    await page.getByRole('button', { name: 'Delete' }).click();
    
    // Note should be removed
    await expect(page.getByText('Personal folder note')).not.toBeVisible();
  });
});
