import { Hono } from 'hono';
import type { Env } from '../types';
import { sessionAuthMiddleware } from '../middleware/auth';

const app = new Hono<{ Bindings: Env }>();

app.use('*', sessionAuthMiddleware);

// GET /settings — read all settings
app.get('/', async (c) => {
  const db = c.env.DB as D1Database;
  const rows = await db.prepare('SELECT key, value FROM settings').all<{ key: string; value: string }>();
  const settings: Record<string, string> = {};
  for (const row of rows.results ?? []) {
    settings[row.key] = row.value;
  }
  return c.json({ settings });
});

// PUT /settings — upsert one or more key/value pairs
app.put('/', async (c) => {
  const db = c.env.DB as D1Database;
  const body = await c.req.json<Record<string, string>>();

  const allowed = ['openrouter_api_key', 'preferred_model'];
  const entries = Object.entries(body).filter(([k]) => allowed.includes(k));

  if (entries.length === 0) {
    return c.json({ error: 'No valid settings keys provided' }, 400);
  }

  for (const [key, value] of entries) {
    await db.prepare(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
    ).bind(key, value).run();
  }

  return c.json({ success: true });
});

// GET /settings/models — proxy OpenRouter model list
app.get('/models', async (c) => {
  const db = c.env.DB as D1Database;
  const row = await db.prepare('SELECT value FROM settings WHERE key = ?')
    .bind('openrouter_api_key')
    .first<{ value: string }>();

  if (!row?.value) {
    return c.json({ error: 'OpenRouter API key not configured' }, 400);
  }

  const res = await fetch('https://openrouter.ai/api/v1/models', {
    headers: { Authorization: `Bearer ${row.value}` },
  });

  if (!res.ok) {
    return c.json({ error: 'Failed to fetch models from OpenRouter' }, 502);
  }

  const data = await res.json<{ data: { id: string; name: string }[] }>();
  const models = (data.data ?? []).map(m => ({ id: m.id, name: m.name }));
  return c.json({ models });
});

export default app;
