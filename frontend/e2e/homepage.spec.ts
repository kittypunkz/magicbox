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
    await input.fill('Test note from E2E ' + Date.now());
    await input.press('Enter');
    
    // Should navigate to note editor
    await expect(page.getByPlaceholder('Note title')).toBeVisible();
  });

  test('should display recent notes section', async ({ page }) => {
    // Create a note first
    const uniqueTitle = 'Recent note test ' + Date.now();
    const input = page.getByPlaceholder("What's on your mind? Use #folder to organize");
    await input.fill(uniqueTitle);
    await input.press('Enter');
    
    // Go back to homepage
    await page.locator('button[title="Back"]').click();
    
    // Check recent notes
    await expect(page.getByText('Recent Notes')).toBeVisible();
    await expect(page.getByText(uniqueTitle)).toBeVisible();
  });

  test('should open note from recent cards', async ({ page }) => {
    // Create a note
    const uniqueTitle = 'Clickable note ' + Date.now();
    const input = page.getByPlaceholder("What's on your mind? Use #folder to organize");
    await input.fill(uniqueTitle);
    await input.press('Enter');
    
    // Add some content
    await page.getByPlaceholder('Start typing...').fill('Note content here');
    
    // Go back
    await page.locator('button[title="Back"]').click();
    
    // Click on recent note card
    await page.getByText(uniqueTitle).first().click();
    
    // Should open note
    await expect(page.getByPlaceholder('Note title')).toHaveValue(uniqueTitle);
    await expect(page.locator('textarea')).toHaveValue(/Note content here/);
  });

  test('should display stats section', async ({ page }) => {
    // Use exact match to avoid sidebar conflicts
    await expect(page.locator('.homepage-stats-notes-label').getByText('Notes')).toBeVisible();
    await expect(page.locator('.homepage-stats-folders-label').getByText('Folders')).toBeVisible();
    await expect(page.locator('.homepage-stats-unused-btn').getByText('Unused')).toBeVisible();
  });

  test('should create folder only and show toast when only hashtag provided', async ({ page }) => {
    const uniqueFolder = 'toastfolder' + Date.now();
    const input = page.getByPlaceholder("What's on your mind? Use #folder to organize");
    
    await input.fill('#' + uniqueFolder);
    await input.press('Enter');
    await input.press('Enter'); // Second enter to select from suggestions and submit
    
    // Should NOT navigate to editor
    await expect(page.getByPlaceholder('Note title')).not.toBeVisible();
    
    // Should show toast
    const toast = page.locator('[data-area-id="toast-notification"]');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText(`Folder '#${uniqueFolder}' is ready`);
    
    // Sidebar should have the folder
    await expect(page.locator('[data-area-id="sidebar"]').getByText(uniqueFolder)).toBeVisible();
  });

  test('should create folder and note when hashtag and content provided', async ({ page }) => {
    const uniqueFolder = 'combined' + Date.now();
    const noteContent = 'This is a note in a new folder';
    const input = page.getByPlaceholder("What's on your mind? Use #folder to organize");
    
    await input.fill(`#${uniqueFolder} ${noteContent}`);
    await input.press('Enter'); // Single enter now works because space hides suggestions
    
    // Should show toast
    const toast = page.locator('[data-area-id="toast-notification"]');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText(`Note added to '#${uniqueFolder}'`);

    // Should navigate to editor
    await expect(page.getByPlaceholder('Note title')).toBeVisible();
    await expect(page.getByPlaceholder('Note title')).toHaveValue(noteContent);
    
    // Check if it's in the right folder in editor
    const folderStatus = page.locator('[data-area-id="editor-save-status"]');
    await expect(folderStatus).toContainText(uniqueFolder);
    
    // Go back
    await page.locator('button[title="Back"]').click();
    
    // Sidebar should have the folder
    await expect(page.locator('[data-area-id="sidebar"]').getByText(uniqueFolder)).toBeVisible();
  });

  test('should support hashtags with hyphens, underscores, and dots', async ({ page }) => {
    const hyphenFolder = 'ai-chat-' + Date.now();
    const underscoreFolder = 'deep_think_' + Date.now();
    const dotFolder = 'ai.chat.' + Date.now();
    const input = page.getByPlaceholder("What's on your mind? Use #folder to organize");
    
    // Test hyphen
    await input.fill(`#${hyphenFolder} content`);
    await input.press('Enter');
    const toast = page.locator('[data-area-id="toast-notification"]');
    await expect(toast).toContainText(`Note added to '#${hyphenFolder}'`);
    await page.locator('.sidebar-all-notes-btn').click(); // Explicitly go back to Home

    // Test underscore
    await expect(input).toBeVisible();
    await input.fill(`#${underscoreFolder} more content`);
    await input.press('Enter');
    await expect(toast).toContainText(`Note added to '#${underscoreFolder}'`);
    await page.locator('.sidebar-all-notes-btn').click(); // Explicitly go back to Home

    // Test dot
    await expect(input).toBeVisible();
    await input.fill(`#${dotFolder} dot content`);
    await input.press('Enter');
    await expect(toast).toContainText(`Note added to '#${dotFolder}'`);
    await page.locator('.sidebar-all-notes-btn').click(); // Explicitly go back to Home
    
    // Sidebar should have all with full names
    const sidebar = page.locator('[data-area-id="sidebar"]');
    await expect(sidebar.getByText(hyphenFolder).first()).toBeVisible();
    await expect(sidebar.getByText(underscoreFolder).first()).toBeVisible();
    await expect(sidebar.getByText(dotFolder).first()).toBeVisible();
  });
});
