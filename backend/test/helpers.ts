import { SELF } from 'cloudflare:test';

const TEST_PASSWORD = 'testpassword123';
const BASE = 'http://localhost';

// Sets up the app and returns a session cookie string ready to use in Cookie headers.
export async function getSessionCookie(): Promise<string> {
  // Try setup first; if already done it returns 400 which we ignore
  await SELF.fetch(`${BASE}/auth/setup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: TEST_PASSWORD }),
  });

  const res = await SELF.fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: TEST_PASSWORD }),
  });

  const raw = res.headers.get('Set-Cookie') ?? '';
  const match = raw.match(/sessionId=([^;]+)/);
  if (!match) throw new Error(`Login failed — no session cookie. Status: ${res.status}`);
  return `sessionId=${match[1]}`;
}

export { BASE };
