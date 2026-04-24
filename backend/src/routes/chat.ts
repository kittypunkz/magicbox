import { Hono } from 'hono';
import { streamText } from 'hono/streaming';
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

// POST /chat — FTS5 RAG + OpenRouter SSE streaming
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
  const q = `"${body.message.slice(0, 200).replace(/"/g, '""')}"`;
  const { results: notes } = await db.prepare(`
    SELECT n.id, n.title, n.content, f.name AS folder_name
    FROM notes_fts fts
    JOIN notes n ON fts.rowid = n.id
    JOIN folders f ON n.folder_id = f.id
    WHERE notes_fts MATCH ?
    ORDER BY rank
    LIMIT 5
  `).bind(q).all<NoteResult>();

  // Build context from retrieved notes
  const context = (notes ?? []).map(n =>
    `[Note ${n.id}: "${n.title}" (#${n.folder_name})]\n${n.content?.slice(0, 500)}`
  ).join('\n\n---\n\n');

  const systemPrompt = context
    ? `You are a helpful assistant with access to the user's notes. Answer their question using the relevant notes below as context. When referencing a note, cite it as [Note ID].

Relevant notes:
${context}`
    : `You are a helpful assistant. Answer the user's question concisely.`;

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
      stream: true,
    }),
  });

  if (!upstreamRes.ok) {
    return c.json({ error: `OpenRouter error: ${upstreamRes.status}` }, 502);
  }

  // Pass note sources in a header so the frontend can show them
  const sources = (notes ?? []).map(n => ({ id: n.id, title: n.title }));

  return streamText(c, async (stream) => {
    // Emit sources as first SSE event
    await stream.writeln(`data: ${JSON.stringify({ type: 'sources', sources })}\n`);

    const reader = upstreamRes.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') {
          await stream.writeln('data: [DONE]\n');
          break;
        }
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            await stream.writeln(`data: ${JSON.stringify({ type: 'token', content })}\n`);
          }
        } catch {
          // skip malformed chunks
        }
      }
    }
  }, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Sources': JSON.stringify(sources),
    },
  });
});

export default app;
