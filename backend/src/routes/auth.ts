import { Hono } from 'hono';
import type { Env } from '../types';

const app = new Hono<{ Bindings: Env }>();

const SESSION_DURATION_DAYS = 7;
const PBKDF2_ITERATIONS = 100_000;

function generateSessionId(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

function getSessionExpiry(): string {
  const date = new Date();
  date.setDate(date.getDate() + SESSION_DURATION_DAYS);
  return date.toISOString();
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2, '0')).join('');
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

async function hashPassword(password: string, saltHex?: string): Promise<{ hash: string; salt: string }> {
  const salt = saltHex ? fromHex(saltHex) : crypto.getRandomValues(new Uint8Array(32));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: PBKDF2_ITERATIONS },
    keyMaterial,
    256
  );
  return { hash: toHex(bits), salt: toHex(salt.buffer) };
}

function sessionCookie(value: string, maxAge: number, host = ''): string {
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
  if (isLocal) {
    return `sessionId=${value}; HttpOnly; SameSite=Lax; Max-Age=${maxAge}; Path=/`;
  }
  return `sessionId=${value}; HttpOnly; Secure; Domain=.bankapirak.com; SameSite=None; Max-Age=${maxAge}; Path=/`;
}

// GET /auth/status
app.get('/status', async (c) => {
  const db = c.env.DB as D1Database;

  let isSetup = false;
  try {
    const user = await db.prepare('SELECT password_hash FROM users WHERE id = 1').first<{ password_hash: string | null }>();
    isSetup = !!(user?.password_hash);
  } catch {
    // column may not exist yet — treat as not set up
  }

  const sessionId = c.req.header('Cookie')?.match(/sessionId=([^;]+)/)?.[1];
  let isAuthenticated = false;
  if (sessionId) {
    try {
      const session = await db.prepare(
        'SELECT id FROM sessions WHERE id = ? AND expires_at > datetime("now")'
      ).bind(sessionId).first();
      isAuthenticated = !!session;
    } catch {}
  }

  return c.json({ isSetup, isAuthenticated });
});

// POST /auth/setup — first-run: create master password
app.post('/setup', async (c) => {
  const db = c.env.DB as D1Database;

  try {
    const user = await db.prepare('SELECT password_hash FROM users WHERE id = 1').first<{ password_hash: string | null }>();
    if (user?.password_hash) {
      return c.json({ error: 'Already set up' }, 400);
    }

    const body = await c.req.json<{ password: string }>();
    if (!body.password || body.password.length < 8) {
      return c.json({ error: 'Password must be at least 8 characters' }, 400);
    }

    const { hash, salt } = await hashPassword(body.password);

    // Upsert the user row in case it doesn't exist yet
    await db.prepare(
      'INSERT INTO users (id, username, password_hash, password_salt) VALUES (1, \'owner\', ?, ?) ON CONFLICT(id) DO UPDATE SET password_hash = excluded.password_hash, password_salt = excluded.password_salt'
    ).bind(hash, salt).run();

    const sessionId = generateSessionId();
    await db.prepare(
      'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, 1, ?)'
    ).bind(sessionId, getSessionExpiry()).run();

    return c.json({ success: true }, 200, {
      'Set-Cookie': sessionCookie(sessionId, SESSION_DURATION_DAYS * 24 * 60 * 60, c.req.header('host')),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Setup error:', msg);
    return c.json({ error: `Setup failed: ${msg}` }, 500);
  }
});

// POST /auth/login
app.post('/login', async (c) => {
  const db = c.env.DB as D1Database;

  const body = await c.req.json<{ password: string }>();
  if (!body.password) {
    return c.json({ error: 'Password required' }, 400);
  }

  const user = await db.prepare(
    'SELECT password_hash, password_salt FROM users WHERE id = 1'
  ).first<{ password_hash: string | null; password_salt: string | null }>();

  if (!user?.password_hash || !user?.password_salt) {
    return c.json({ error: 'Setup required' }, 400);
  }

  const { hash } = await hashPassword(body.password, user.password_salt);

  if (hash !== user.password_hash) {
    return c.json({ error: 'Invalid password' }, 401);
  }

  const sessionId = generateSessionId();
  await db.prepare(
    'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, 1, ?)'
  ).bind(sessionId, getSessionExpiry()).run();

  return c.json({ success: true }, 200, {
    'Set-Cookie': sessionCookie(sessionId, SESSION_DURATION_DAYS * 24 * 60 * 60, c.req.header('host')),
  });
});

// POST /auth/logout
app.post('/logout', async (c) => {
  const db = c.env.DB as D1Database;
  const sessionId = c.req.header('Cookie')?.match(/sessionId=([^;]+)/)?.[1];

  if (sessionId) {
    await db.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
  }

  return c.json({ success: true }, 200, {
    'Set-Cookie': sessionCookie('', 0, c.req.header('host')),
  });
});

// GET /auth/me
app.get('/me', async (c) => {
  const db = c.env.DB as D1Database;
  const sessionId = c.req.header('Cookie')?.match(/sessionId=([^;]+)/)?.[1];

  if (!sessionId) {
    return c.json({ error: 'Not authenticated' }, 401);
  }

  const session = await db.prepare(
    `SELECT s.expires_at, u.username
     FROM sessions s JOIN users u ON s.user_id = u.id
     WHERE s.id = ? AND s.expires_at > datetime("now")`
  ).bind(sessionId).first<{ username: string; expires_at: string }>();

  if (!session) {
    return c.json({ error: 'Session expired' }, 401);
  }

  return c.json({ username: session.username, expiresAt: session.expires_at });
});

export default app;
