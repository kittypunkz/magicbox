import { test as setup, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const authFile = path.join(process.cwd(), '.auth', 'user.json');

setup('authenticate', async ({ request }) => {
  // Ensure .auth directory exists
  fs.mkdirSync(path.dirname(authFile), { recursive: true });

  // Hit the test login endpoint on the API server
  const response = await request.post('https://api.magicbox.bankapirak.com/auth/test-login', {
    data: { secret: 'e2e-test-secret-magicbox-2026' }
  });

  expect(response.ok()).toBeTruthy();

  // Save the storage state (cookies)
  await request.storageState({ path: authFile });
});
