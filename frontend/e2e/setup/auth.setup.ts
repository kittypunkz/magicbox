import { test as setup, expect } from '@playwright/test';
import path from 'path';

const API_URL = 'http://localhost:8787';
const E2E_PASSWORD = process.env.E2E_PASSWORD || 'testpass123!';
const AUTH_FILE = path.join(__dirname, '../../playwright/.auth/state.json');

setup('authenticate', async ({ page }) => {
  // Check current auth status
  const statusRes = await page.request.get(`${API_URL}/auth/status`);
  const { isSetup } = await statusRes.json() as { isSetup: boolean };

  if (!isSetup) {
    // First-time setup
    const setupRes = await page.request.post(`${API_URL}/auth/setup`, {
      data: { password: E2E_PASSWORD },
    });
    expect(setupRes.ok()).toBeTruthy();
  } else {
    // Already set up — login
    const loginRes = await page.request.post(`${API_URL}/auth/login`, {
      data: { password: E2E_PASSWORD },
    });
    // If login fails the password has changed; the test environment needs a reset
    expect(loginRes.ok(), `Login failed — is the backend running with a fresh local DB? Try: wrangler d1 execute magicbox-db --local --command "DELETE FROM users; DELETE FROM sessions;"`).toBeTruthy();
  }

  // Confirm the app shows as authenticated
  await page.goto('/');
  await expect(page).not.toHaveURL(/\/login|\/setup/);

  // Save browser cookies/storage so all other tests reuse this session
  await page.context().storageState({ path: AUTH_FILE });
});
