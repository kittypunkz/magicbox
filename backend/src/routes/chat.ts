import { Hono } from 'hono';
import type { Env } from '../types';
import { sessionAuthMiddleware } from '../middleware/auth';
import { getAIConfig } from '../lib/settings';

interface NoteResult {
  id: number;
  title: string;
  content: string;
  folder_name: string;
}

const app = new Hono<{ Bindings: Env }>();

app.use('*', sessionAuthMiddleware);

// POST /chat — FTS5 RAG + OpenRouter (non-streaming for reliability)
app.post('/', async (c) => {
  const body = await c.req.json<{ message: string }>();
  if (!body.message?.trim()) {
    return c.json({ error: 'Message required' }, 400);
  }

  const db = c.env.DB as D1Database;

  const aiCfg = await getAIConfig(c.env);
  if (!aiCfg) return c.json({ error: 'OpenRouter API key not configured' }, 400);
  const { apiKey, model } = aiCfg;

  // FTS5 retrieval — search individual words, fallback to recent notes
  let notes: NoteResult[] = [];
  try {
    // Build an OR query from individual words (more permissive than phrase match)
    const words = body.message
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2)
      .slice(0, 10)
      .map(w => w.replace(/"/g, ''))
      .join(' OR ');

    if (words) {
      const result = await db.prepare(`
        SELECT n.id, n.title, n.content, f.name AS folder_name
        FROM notes_fts fts
        JOIN notes n ON fts.rowid = n.id
        JOIN folders f ON n.folder_id = f.id
        WHERE notes_fts MATCH ?
        ORDER BY rank
        LIMIT 8
      `).bind(words).all<NoteResult>();
      notes = result.results ?? [];
    }
  } catch {
    // FTS5 failed — will use recent notes fallback below
  }

  // Always include the 3 most recently updated notes (deduplicated with FTS5 results)
  try {
    const recentResult = await db.prepare(`
      SELECT n.id, n.title, n.content, f.name AS folder_name
      FROM notes n
      JOIN folders f ON n.folder_id = f.id
      ORDER BY n.updated_at DESC
      LIMIT 3
    `).all<NoteResult>();
    const existingIds = new Set(notes.map(n => n.id));
    for (const note of recentResult.results ?? []) {
      if (!existingIds.has(note.id)) notes.push(note);
    }
  } catch {}

  // If still nothing, that means there are no notes at all
  if (notes.length === 0) {
    return c.json({ content: "You don't have any notes yet. Create some notes first, then ask me questions about them.", sources: [] });
  }

  const context = notes.map(n =>
    `[Note ${n.id}: "${n.title}" (#${n.folder_name})]\n${n.content?.slice(0, 500)}`
  ).join('\n\n---\n\n');

  const systemPrompt = context
    ? `You are an assistant that helps the user recall and reason about their personal notes. Use the notes below as your primary source. If the answer is clearly in the notes, cite it as [Note ID]. If the notes don't contain enough information, say so honestly rather than inventing details.

Notes:
${context}`
    : `You are an assistant for the user's personal notes. No notes were found. Tell the user their notes don't seem to contain relevant information for this question, and suggest what kinds of notes would help.`;

  const upstreamRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: body.message },
      ],
      stream: false,
    }),
  });

  if (!upstreamRes.ok) {
    const err = await upstreamRes.text();
    return c.json({ error: `OpenRouter error ${upstreamRes.status}: ${err.slice(0, 200)}` }, 502);
  }

  const data = await upstreamRes.json<{
    choices: [{ message: { content: string } }];
  }>();

  const content = data.choices?.[0]?.message?.content ?? '';
  const sources = notes.map(n => ({ id: n.id, title: n.title }));

  return c.json({ content, sources });
});

export default app;
