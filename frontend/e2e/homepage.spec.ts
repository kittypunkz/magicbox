import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display homepage hero', async ({ page }) => {
    await expect(page.getByText('Welcome to MagicBox')).toBeVisible();
    await expect(page.getByText('Capture your thoughts. Organize with folders.')).toBeVisible();
  });

  test('should display central input', async ({ page }) => {
    await expect(page.getByPlaceholder("What's on your mind? Use #folder to organize")).toBeVisible();
  });

  test('should create a new note from central input', async ({ page }) => {
    const input = page.getByPlaceholder("What's on your mind? Use #folder to organize");
    await input.fill('Test note from E2E');
    await input.press('Enter');
    
    // Should navigate to note editor
    await expect(page.getByPlaceholder('Note title')).toBeVisible();
    await expect(page.getByPlaceholder('Note title')).toHaveValue('Test note from E2E');
  });

  test('should display recent notes section', async ({ page }) => {
    // Create a note first
    const input = page.getByPlaceholder("What's on your mind? Use #folder to organize");
    await input.fill('Recent note test');
    await input.press('Enter');
    
    // Go back to homepage
    await page.getByRole('button', { name: 'Back' }).click();
    
    // Check recent notes
    await expect(page.getByText('Recent Notes')).toBeVisible();
    await expect(page.getByText('Recent note test')).toBeVisible();
  });

  test('should open note from recent cards', async ({ page }) => {
    // Create a note
    const input = page.getByPlaceholder("What's on your mind? Use #folder to organize");
    await input.fill('Clickable note');
    await input.press('Enter');
    
    // Add some content
    await page.getByPlaceholder('Start typing...').fill('Note content here');
    
    // Go back
    await page.getByRole('button', { name: 'Back' }).click();
    
    // Click on recent note card
    await page.getByText('Clickable note').click();
    
    // Should open note
    await expect(page.getByPlaceholder('Note title')).toHaveValue('Clickable note');
    await expect(page.getByText('Note content here')).toBeVisible();
  });

  test('should display stats section', async ({ page }) => {
    // Use exact match to avoid sidebar conflicts
    await expect(page.locator('.homepage-stats-notes-label').getByText('Notes')).toBeVisible();
    await expect(page.locator('.homepage-stats-folders-label').getByText('Folders')).toBeVisible();
    await expect(page.locator('.homepage-stats-unused-btn').getByText('Unused')).toBeVisible();
  });
});
