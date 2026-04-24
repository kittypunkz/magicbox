import { Hono } from 'hono';
import type { Env } from '../types';
import { sessionAuthMiddleware } from '../middleware/auth';
import { getAIConfig } from '../lib/settings';

interface NoteResult {
  id: number;
  title: string;
  content: string;
  folder_name: string;
  updated_at: string;
}

interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

const app = new Hono<{ Bindings: Env }>();

app.use('*', sessionAuthMiddleware);

// Step 1: Ask the AI to extract search keywords from the user's question.
// This lets FTS5 match semantically related notes even when exact words differ.
async function expandQuery(message: string, apiKey: string, model: string): Promise<string> {
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [{
          role: 'user',
          content: `Extract 6-10 search keywords from this question. Include synonyms and related terms. Return ONLY comma-separated keywords, nothing else.\n\nQuestion: ${message}`,
        }],
        max_tokens: 80,
        temperature: 0,
      }),
    });
    if (!res.ok) return message;
    const data = await res.json<{ choices: [{ message: { content: string } }] }>();
    const keywords = data.choices?.[0]?.message?.content?.trim();
    return keywords || message;
  } catch {
    return message;
  }
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

// POST /chat
app.post('/', async (c) => {
  const body = await c.req.json<{ message: string; history?: HistoryMessage[] }>();
  if (!body.message?.trim()) {
    return c.json({ error: 'Message required' }, 400);
  }

  const db = c.env.DB as D1Database;
  const history = (body.history ?? []).slice(-10); // keep last 10 turns max

  const aiCfg = await getAIConfig(c.env);
  if (!aiCfg) return c.json({ error: 'OpenRouter API key not configured' }, 400);
  const { apiKey, model } = aiCfg;

  // Step 1: Query expansion — get semantically related keywords
  const expandedTerms = await expandQuery(body.message, apiKey, model);

  // Step 2: FTS5 search with expanded keywords
  let notes: NoteResult[] = [];
  try {
    const words = expandedTerms
      .toLowerCase()
      .replace(/[^\w\s,]/g, ' ')
      .split(/[\s,]+/)
      .filter(w => w.length > 2)
      .slice(0, 15)
      .map(w => w.replace(/"/g, ''))
      .join(' OR ');

    if (words) {
      const result = await db.prepare(`
        SELECT n.id, n.title, n.content, f.name AS folder_name, n.updated_at
        FROM notes_fts fts
        JOIN notes n ON fts.rowid = n.id
        JOIN folders f ON n.folder_id = f.id
        WHERE notes_fts MATCH ?
        ORDER BY rank
        LIMIT 8
      `).bind(words).all<NoteResult>();
      notes = result.results ?? [];
    }
  } catch {}

  // Step 3: Always append 3 most recently updated notes (catches new notes)
  try {
    const recent = await db.prepare(`
      SELECT n.id, n.title, n.content, f.name AS folder_name, n.updated_at
      FROM notes n
      JOIN folders f ON n.folder_id = f.id
      ORDER BY n.updated_at DESC
      LIMIT 3
    `).all<NoteResult>();
    const seen = new Set(notes.map(n => n.id));
    for (const note of recent.results ?? []) {
      if (!seen.has(note.id)) notes.push(note);
    }
  } catch {}

  if (notes.length === 0) {
    return c.json({
      content: "You don't have any notes yet. Create some notes first, then I can help you recall and reason about them.",
      sources: [],
    });
  }

  // Step 4: Format context with metadata so AI can reason about time and folders
  const context = notes.map(n =>
    `[Note ${n.id} | #${n.folder_name} | updated ${relativeTime(n.updated_at)}]\nTitle: ${n.title}\n${n.content?.slice(0, 600)}`
  ).join('\n\n---\n\n');

  const systemPrompt = `You are a personal knowledge assistant. You help the user recall, connect, and reason about their own notes.

Guidelines:
- Answer based on the notes provided. Cite relevant notes as [Note ID].
- If multiple notes are relevant, synthesize them into a coherent answer.
- If the notes don't contain enough information, say so clearly — do not invent details.
- Be concise and direct. Use the note metadata (folder, date) to give context-aware answers.
- If the user asks a follow-up question, use the conversation history to understand context.

User's notes:
${context}`;

  // Step 5: Call OpenRouter with conversation history
  const upstreamRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: body.message },
      ],
      stream: false,
    }),
  });

  if (!upstreamRes.ok) {
    const err = await upstreamRes.text();
    return c.json({ error: `OpenRouter error ${upstreamRes.status}: ${err.slice(0, 300)}` }, 502);
  }

  const data = await upstreamRes.json<{ choices: [{ message: { content: string } }] }>();
  const content = data.choices?.[0]?.message?.content ?? '';
  const sources = notes.map(n => ({ id: n.id, title: n.title }));

  return c.json({ content, sources });
});

export default app;
