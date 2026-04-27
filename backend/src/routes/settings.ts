import { Hono } from 'hono';
import type { Env } from '../types';
import { sessionAuthMiddleware } from '../middleware/auth';
import { getAIConfig } from '../lib/settings';

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

  const allowed = [
    'openrouter_api_key', 'preferred_model',
    'brief_temperature', 'task_temperature',
    'brief_time_window_hours', 'brief_max_notes', 'brief_max_tasks',
    'timezone', 'autosave_delay_ms',
    'prompt_chat', 'prompt_brief', 'prompt_task_extract',
  ];
  const entries = Object.entries(body).filter(([k]) => allowed.includes(k));

  if (entries.length === 0) {
    return c.json({ error: 'No valid settings keys provided' }, 400);
  }

  for (const [key, value] of entries) {
    if (value === '') {
      // Empty string = reset to default — remove from DB
      await db.prepare('DELETE FROM settings WHERE key = ?').bind(key).run();
    } else {
      await db.prepare(
        'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
      ).bind(key, value).run();
    }
  }

  return c.json({ success: true });
});

// GET /settings/models — proxy OpenRouter model list
app.get('/models', async (c) => {
  const aiCfg = await getAIConfig(c.env);
  if (!aiCfg) {
    return c.json({ error: 'OpenRouter API key not configured' }, 400);
  }

  const res = await fetch('https://openrouter.ai/api/v1/models', {
    headers: { Authorization: `Bearer ${aiCfg.apiKey}` },
  });

  if (!res.ok) {
    return c.json({ error: 'Failed to fetch models from OpenRouter' }, 502);
  }

  const data = await res.json<{ data: { id: string; name: string }[] }>();
  const models = (data.data ?? []).map(m => ({ id: m.id, name: m.name }));
  return c.json({ models });
});

// GET /settings/debug — test OpenRouter connection, return full diagnostics
app.get('/debug', async (c) => {
  const log: string[] = [];

  // 1. Check env secret
  const hasEnvKey = !!c.env.OPENROUTER_API_KEY;
  log.push(`OPENROUTER_API_KEY env secret: ${hasEnvKey ? 'present' : 'missing'}`);

  // 2. Check DB setting
  const db = c.env.DB as D1Database;
  let dbKey = '';
  let dbModel = '';
  try {
    const rows = await db.prepare(
      "SELECT key, value FROM settings WHERE key IN ('openrouter_api_key', 'preferred_model')"
    ).all<{ key: string; value: string }>();
    for (const r of rows.results ?? []) {
      if (r.key === 'openrouter_api_key') dbKey = r.value;
      if (r.key === 'preferred_model') dbModel = r.value;
    }
    log.push(`DB openrouter_api_key: ${dbKey ? `present (${dbKey.slice(0, 8)}...)` : 'missing'}`);
    log.push(`DB preferred_model: ${dbModel || '(not set)'}`);
  } catch (err) {
    log.push(`DB read error: ${(err as Error).message}`);
  }

  // 3. Resolve effective config
  const apiKey = c.env.OPENROUTER_API_KEY || dbKey;
  const model = dbModel || 'openai/gpt-4o-mini';
  log.push(`Effective API key: ${apiKey ? `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}` : 'NONE'}`);
  log.push(`Effective model: ${model}`);

  if (!apiKey) {
    return c.json({ ok: false, log, error: 'No API key available' });
  }

  // 4. Make a minimal test call to OpenRouter
  log.push('Calling OpenRouter /chat/completions...');
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Say "ok" in one word.' }],
        max_tokens: 5,
        stream: false,
      }),
    });

    const status = res.status;
    const text = await res.text();
    log.push(`OpenRouter status: ${status}`);
    log.push(`OpenRouter response: ${text.slice(0, 500)}`);

    if (res.ok) {
      const data = JSON.parse(text);
      const reply = data.choices?.[0]?.message?.content ?? '(no content)';
      return c.json({ ok: true, log, reply });
    } else {
      return c.json({ ok: false, log, error: `HTTP ${status}` });
    }
  } catch (err) {
    log.push(`Fetch error: ${(err as Error).message}`);
    return c.json({ ok: false, log, error: (err as Error).message });
  }
});

export default app;
