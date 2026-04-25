import { describe, test, expect } from 'vitest';
import { SELF } from 'cloudflare:test';

const BASE = 'http://localhost';

describe('POST /auth/setup', () => {
  test('creates user and returns session cookie', async () => {
    const res = await SELF.fetch(`${BASE}/auth/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'mypassword123' }),
    });
    expect(res.status).toBe(200);
    const data = await res.json() as { success: boolean };
    expect(data.success).toBe(true);
    expect(res.headers.get('Set-Cookie')).toMatch(/sessionId=/);
  });

  test('rejects password shorter than 8 chars', async () => {
    const res = await SELF.fetch(`${BASE}/auth/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'short' }),
    });
    expect(res.status).toBe(400);
  });

  test('rejects duplicate setup', async () => {
    await SELF.fetch(`${BASE}/auth/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'mypassword123' }),
    });
    const res = await SELF.fetch(`${BASE}/auth/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'mypassword123' }),
    });
    expect(res.status).toBe(400);
  });
});

describe('POST /auth/login', () => {
  test('returns session cookie on correct password', async () => {
    await SELF.fetch(`${BASE}/auth/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'mypassword123' }),
    });

    const res = await SELF.fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'mypassword123' }),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get('Set-Cookie')).toMatch(/sessionId=/);
  });

  test('rejects wrong password', async () => {
    await SELF.fetch(`${BASE}/auth/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'mypassword123' }),
    });

    const res = await SELF.fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'wrongpassword' }),
    });
    expect(res.status).toBe(401);
  });
});

describe('GET /auth/status', () => {
  test('returns isSetup:false before setup', async () => {
    const res = await SELF.fetch(`${BASE}/auth/status`);
    expect(res.status).toBe(200);
    const data = await res.json() as { isSetup: boolean; isAuthenticated: boolean };
    expect(data.isSetup).toBe(false);
    expect(data.isAuthenticated).toBe(false);
  });

  test('returns isSetup:true and isAuthenticated:true with valid session', async () => {
    const setupRes = await SELF.fetch(`${BASE}/auth/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'mypassword123' }),
    });
    const cookie = setupRes.headers.get('Set-Cookie')?.match(/sessionId=[^;]+/)?.[0] ?? '';

    const res = await SELF.fetch(`${BASE}/auth/status`, {
      headers: { Cookie: cookie },
    });
    const data = await res.json() as { isSetup: boolean; isAuthenticated: boolean };
    expect(data.isSetup).toBe(true);
    expect(data.isAuthenticated).toBe(true);
  });
});
