import { Hono } from 'hono';
import type { Env } from '../types';
import { sessionAuthMiddleware } from '../middleware/auth';

interface Brief {
  id: number;
  date: string;
  content: string;
  created_at: string;
}

interface Note {
  id: number;
  title: string;
  content: string;
}

interface Task {
  id: number;
  title: string;
  status: string;
}

const app = new Hono<{ Bindings: Env }>();

app.use('*', sessionAuthMiddleware);

async function generateBrief(
  db: D1Database,
  apiKey: string,
  model: string,
  date: string
): Promise<string> {
  // Get yesterday's notes (created or updated in last 24h)
  const { results: notes } = await db.prepare(
    "SELECT id, title, content FROM notes WHERE updated_at >= datetime('now', '-24 hours') ORDER BY updated_at DESC LIMIT 20"
  ).all<Note>();

  // Get pending tasks
  const { results: tasks } = await db.prepare(
    "SELECT id, title, status FROM tasks WHERE status = 'pending' ORDER BY created_at DESC LIMIT 20"
  ).all<Task>();

  const notesSummary = (notes ?? []).map(n =>
    `- Note ${n.id}: "${n.title}"\n  ${n.content?.slice(0, 200)}`
  ).join('\n');

  const tasksSummary = (tasks ?? []).map(t => `- [${t.id}] ${t.title}`).join('\n');

  const prompt = `Generate a brief daily summary for ${date}.

Recent notes (last 24h):
${notesSummary || '(none)'}

Pending tasks:
${tasksSummary || '(none)'}

Write a concise, markdown-formatted daily brief (2-3 paragraphs + a task list). Be encouraging and actionable. Start directly with the content, no title needed.`;

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    }),
  });

  if (!res.ok) throw new Error(`OpenRouter error: ${res.status}`);

  const data = await res.json<{ choices: [{ message: { content: string } }] }>();
  return data.choices[0].message.content;
}

// GET /brief — today's brief (generate if missing)
app.get('/', async (c) => {
  const db = c.env.DB as D1Database;
  const today = new Date().toISOString().slice(0, 10);

  let brief = await db.prepare('SELECT * FROM daily_briefs WHERE date = ?').bind(today).first<Brief>();

  if (!brief) {
    // Generate on-demand
    const rows = await db.prepare(
      "SELECT key, value FROM settings WHERE key IN ('openrouter_api_key', 'preferred_model')"
    ).all<{ key: string; value: string }>();
    const cfg: Record<string, string> = {};
    for (const r of rows.results ?? []) cfg[r.key] = r.value;

    if (!cfg.openrouter_api_key) {
      return c.json({ error: 'OpenRouter API key not configured — set it in Settings' }, 400);
    }

    const model = cfg.preferred_model || 'openai/gpt-4o-mini';

    try {
      const content = await generateBrief(db, cfg.openrouter_api_key, model, today);
      brief = await db.prepare(
        'INSERT INTO daily_briefs (date, content) VALUES (?, ?) RETURNING *'
      ).bind(today, content).first<Brief>();
    } catch (err) {
      return c.json({ error: `Failed to generate brief: ${(err as Error).message}` }, 502);
    }
  }

  return c.json({ brief });
});

// GET /briefs — brief history list
app.get('/all', async (c) => {
  const db = c.env.DB as D1Database;
  const { results } = await db.prepare(
    'SELECT id, date, created_at, substr(content, 1, 200) AS preview FROM daily_briefs ORDER BY date DESC LIMIT 30'
  ).all<{ id: number; date: string; created_at: string; preview: string }>();

  return c.json({ briefs: results ?? [] });
});

// GET /briefs/:date — get specific brief
app.get('/:date', async (c) => {
  const date = c.req.param('date');
  const db = c.env.DB as D1Database;
  const brief = await db.prepare('SELECT * FROM daily_briefs WHERE date = ?').bind(date).first<Brief>();

  if (!brief) return c.json({ error: 'Brief not found' }, 404);
  return c.json({ brief });
});

export { generateBrief };
export default app;
