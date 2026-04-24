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

  // FTS5 retrieval — top 5 matching notes
  let notes: NoteResult[] = [];
  try {
    const q = `"${body.message.slice(0, 200).replace(/"/g, '""')}"`;
    const result = await db.prepare(`
      SELECT n.id, n.title, n.content, f.name AS folder_name
      FROM notes_fts fts
      JOIN notes n ON fts.rowid = n.id
      JOIN folders f ON n.folder_id = f.id
      WHERE notes_fts MATCH ?
      ORDER BY rank
      LIMIT 5
    `).bind(q).all<NoteResult>();
    notes = result.results ?? [];
  } catch {
    // FTS5 may fail on short queries — proceed without context
  }

  const context = notes.map(n =>
    `[Note ${n.id}: "${n.title}" (#${n.folder_name})]\n${n.content?.slice(0, 500)}`
  ).join('\n\n---\n\n');

  const systemPrompt = context
    ? `You are a search assistant for the user's personal notes. Answer ONLY using the notes provided below. Do not use any outside knowledge. If the notes don't contain enough information to answer, say so. Cite notes as [Note ID].

Notes:
${context}`
    : 'You are a search assistant for the user\'s personal notes. No relevant notes were found for this query. Tell the user you couldn\'t find relevant notes and suggest they try different keywords.';

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
