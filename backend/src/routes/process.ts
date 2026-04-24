import { Hono } from 'hono';
import type { Env } from '../types';
import { sessionAuthMiddleware } from '../middleware/auth';

interface Note {
  id: number;
  title: string;
  content: string;
}

interface SuggestedTask {
  title: string;
}

const app = new Hono<{ Bindings: Env }>();

app.use('*', sessionAuthMiddleware);

async function extractTasksFromNote(note: Note, apiKey: string, model: string): Promise<SuggestedTask[]> {
  const prompt = `Extract actionable tasks from the following note. Return a JSON array of objects with a "title" field. Only include clear action items. If there are no tasks, return an empty array.

Note title: ${note.title}
Note content:
${note.content}

Return only valid JSON, no markdown:`;

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenRouter error: ${res.status}`);
  }

  const data = await res.json<{ choices: [{ message: { content: string } }] }>();
  const text = data.choices[0].message.content.trim();

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return parsed.filter((t): t is SuggestedTask => typeof t?.title === 'string');
    }
    return [];
  } catch {
    return [];
  }
}

async function getSettings(db: D1Database): Promise<{ apiKey: string; model: string } | null> {
  const rows = await db.prepare(
    "SELECT key, value FROM settings WHERE key IN ('openrouter_api_key', 'preferred_model')"
  ).all<{ key: string; value: string }>();

  const map: Record<string, string> = {};
  for (const row of rows.results ?? []) map[row.key] = row.value;

  if (!map.openrouter_api_key) return null;
  return {
    apiKey: map.openrouter_api_key,
    model: map.preferred_model || 'openai/gpt-4o-mini',
  };
}

// POST /process/notes/:id — extract tasks from a single note
app.post('/notes/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  if (isNaN(id)) return c.json({ error: 'Invalid note id' }, 400);

  const db = c.env.DB as D1Database;

  const cfg = await getSettings(db);
  if (!cfg) return c.json({ error: 'OpenRouter API key not configured' }, 400);

  const note = await db.prepare(
    'SELECT id, title, content FROM notes WHERE id = ?'
  ).bind(id).first<Note>();

  if (!note) return c.json({ error: 'Note not found' }, 404);

  const tasks = await extractTasksFromNote(note, cfg.apiKey, cfg.model);
  return c.json({ tasks, note_id: note.id });
});

// POST /process/recent — extract tasks from notes created in last 24h
app.post('/recent', async (c) => {
  const db = c.env.DB as D1Database;

  const cfg = await getSettings(db);
  if (!cfg) return c.json({ error: 'OpenRouter API key not configured' }, 400);

  const notes = await db.prepare(
    "SELECT id, title, content FROM notes WHERE created_at >= datetime('now', '-24 hours') ORDER BY created_at DESC LIMIT 10"
  ).all<Note>();

  const results = [];
  for (const note of notes.results ?? []) {
    try {
      const tasks = await extractTasksFromNote(note, cfg.apiKey, cfg.model);
      if (tasks.length > 0) {
        results.push({ note_id: note.id, note_title: note.title, tasks });
      }
    } catch {
      // skip failed notes
    }
  }

  return c.json({ results });
});

export default app;
