import { Hono } from 'hono';
import type { Env } from '../types';
import { sessionAuthMiddleware } from '../middleware/auth';
import { getAIConfig } from '../lib/settings';

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

function extractJSON(text: string): string {
  // Strip markdown code fences: ```json ... ``` or ``` ... ```
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  // Extract first [...] array found in the text
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start !== -1 && end > start) return text.slice(start, end + 1);
  return text.trim();
}

async function semanticDedup(suggestions: SuggestedTask[], existingTitles: string[], apiKey: string, model: string): Promise<SuggestedTask[]> {
  if (existingTitles.length === 0 || suggestions.length === 0) return suggestions;

  const prompt = `You are a task deduplication assistant. Given a list of already-created tasks and new suggestions, return only the suggestions that represent genuinely NEW work not already covered.

Already created tasks:
${existingTitles.map(t => `- ${t}`).join('\n')}

New suggestions to filter:
${suggestions.map(t => `- ${t.title}`).join('\n')}

Rules:
- Return a JSON array of objects with a "title" field
- Exclude any suggestion that is semantically equivalent to an already-created task, even if worded differently
  (e.g. "Call John" and "Phone John" are duplicates; "Buy groceries" and "Purchase food items" are duplicates)
- Keep suggestions that represent distinct new work
- Return ONLY the JSON array, nothing else`;

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], temperature: 0 }),
  });

  if (!res.ok) return suggestions; // fallback: keep all if dedup call fails

  const data = await res.json<{ choices: [{ message: { content: string } }] }>();
  const text = extractJSON(data.choices[0].message.content);
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return parsed.filter((t): t is SuggestedTask => typeof t?.title === 'string' && t.title.trim().length > 0);
    }
  } catch { /* fallback below */ }
  return suggestions;
}

async function extractTasksFromNote(note: Note, apiKey: string, model: string, existingTitles: string[] = []): Promise<SuggestedTask[]> {
  const exclusionBlock = existingTitles.length > 0
    ? `\nAlready created tasks for this note (do NOT suggest these again, including semantically similar ones):\n${existingTitles.map(t => `- ${t}`).join('\n')}\n`
    : '';

  const prompt = `You are a task extraction assistant. Read the note below and extract every actionable task or to-do item.

Rules:
- Return a JSON array of objects, each with a "title" field (string)
- A task is something that needs to be done: "call John", "fix the bug", "buy groceries"
- Do NOT include general statements or facts as tasks
- If there are no tasks, return an empty array: []
- Return ONLY the JSON array, nothing else${exclusionBlock}

Note title: ${note.title}
Note content:
${note.content}`;

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenRouter error: ${res.status}`);
  }

  const data = await res.json<{ choices: [{ message: { content: string } }] }>();
  const raw = data.choices[0].message.content;
  const text = extractJSON(raw);

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return parsed.filter((t): t is SuggestedTask => typeof t?.title === 'string' && t.title.trim().length > 0);
    }
    return [];
  } catch {
    return [];
  }
}


// POST /process/notes/:id — extract tasks from a single note
app.post('/notes/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  if (isNaN(id)) return c.json({ error: 'Invalid note id' }, 400);

  const db = c.env.DB as D1Database;

  const cfg = await getAIConfig(c.env);
  if (!cfg) return c.json({ error: 'OpenRouter API key not configured' }, 400);

  const note = await db.prepare(
    'SELECT id, title, content FROM notes WHERE id = ?'
  ).bind(id).first<Note>();

  if (!note) return c.json({ error: 'Note not found' }, 404);

  const existingRes = await db.prepare(
    'SELECT title FROM tasks WHERE note_id = ?'
  ).bind(id).all<{ title: string }>();
  const existingTitles = existingRes.results?.map(t => t.title) ?? [];

  const rawTasks = await extractTasksFromNote(note, cfg.apiKey, cfg.model, existingTitles);
  const tasks = await semanticDedup(rawTasks, existingTitles, cfg.apiKey, cfg.model);

  return c.json({ tasks, note_id: note.id });
});

// POST /process/recent — extract tasks from notes created in last 24h
app.post('/recent', async (c) => {
  const db = c.env.DB as D1Database;

  const cfg = await getAIConfig(c.env);
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
