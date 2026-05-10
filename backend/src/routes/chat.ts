import { Hono } from 'hono';
import type { Env } from '../types';
import { sessionAuthMiddleware } from '../middleware/auth';
import { getAIConfig, getUserPrefs } from '../lib/settings';

interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatScope {
  scope: 'today' | 'this_week' | 'notes' | 'tasks' | 'bookmarks' | 'all' | 'custom';
  from?: string;
  to?: string;
}

interface NoteSearchResult {
  id: number;
  title: string;
  content: string;
  folder_name: string;
  updated_at: string;
  bookmark_url: string | null;
  bookmark_title: string | null;
}

interface TaskSearchResult {
  id: number;
  title: string;
  description: string | null;
  status: 'backlog' | 'doing' | 'done';
  created_at: string;
  completed_at: string | null;
  note_id: number | null;
  note_title: string | null;
}

interface RetrievalSource {
  id: number;
  type: 'note' | 'task' | 'bookmark';
  title: string;
  subtitle?: string;
  note_id?: number | null;
  url?: string | null;
}

const app = new Hono<{ Bindings: Env }>();

app.use('*', sessionAuthMiddleware);

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
    return data.choices?.[0]?.message?.content?.trim() || message;
  } catch {
    return message;
  }
}

function keywordTokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s,/-]/g, ' ')
    .split(/[\s,]+/)
    .map(word => word.trim())
    .filter(word => word.length > 2)
    .slice(0, 15);
}

function escapeLike(word: string): string {
  return word.replace(/[%_]/g, match => `\\${match}`);
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

function bangkokToday(): string {
  return new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function resolveDateRange(scope: ChatScope): { from?: string; to?: string } {
  const today = bangkokToday();
  if (scope.scope === 'today') return { from: today, to: today };
  if (scope.scope === 'this_week') {
    const local = new Date(`${today}T00:00:00+07:00`);
    const day = local.getDay();
    const daysSinceMonday = (day + 6) % 7;
    local.setDate(local.getDate() - daysSinceMonday);
    const from = local.toISOString().slice(0, 10);
    return { from, to: today };
  }
  if (scope.scope === 'custom' && scope.from && scope.to) {
    return { from: scope.from, to: scope.to };
  }
  return {};
}

function noteScopeCondition(scope: ChatScope): { sql: string; params: string[] } {
  const { from, to } = resolveDateRange(scope);
  if (from && to) {
    return {
      sql: `AND date(n.updated_at, '+7 hours') >= ? AND date(n.updated_at, '+7 hours') <= ?`,
      params: [from, to],
    };
  }
  return { sql: '', params: [] };
}

function taskScopeCondition(scope: ChatScope): { sql: string; params: string[] } {
  const { from, to } = resolveDateRange(scope);
  if (from && to) {
    return {
      sql: `AND (
        date(t.created_at, '+7 hours') >= ? AND date(t.created_at, '+7 hours') <= ?
        OR (t.completed_at IS NOT NULL AND date(t.completed_at, '+7 hours') >= ? AND date(t.completed_at, '+7 hours') <= ?)
      )`,
      params: [from, to, from, to],
    };
  }
  return { sql: '', params: [] };
}

function bookmarkContext(note: NoteSearchResult): string {
  return `[Bookmark ${note.id} | #${note.folder_name} | updated ${relativeTime(note.updated_at)}]\nTitle: ${note.bookmark_title || note.title}\nURL: ${note.bookmark_url || '(missing url)'}\n${note.content?.slice(0, 500) ?? ''}`;
}

function noteContext(note: NoteSearchResult): string {
  return `[Note ${note.id} | #${note.folder_name} | updated ${relativeTime(note.updated_at)}]\nTitle: ${note.title}\n${note.content?.slice(0, 600) ?? ''}`;
}

function taskContext(task: TaskSearchResult): string {
  return `[Task ${task.id} | ${task.status} | created ${relativeTime(task.created_at)}]\nTitle: ${task.title}\n${task.description?.slice(0, 400) ?? ''}${task.note_title ? `\nLinked note: ${task.note_title}` : ''}`;
}

async function retrieveNotes(
  db: D1Database,
  words: string,
  scope: ChatScope,
): Promise<NoteSearchResult[]> {
  const { sql, params } = noteScopeCondition(scope);
  if (!words) return [];
  const result = await db.prepare(`
    SELECT n.id, n.title, n.content, f.name AS folder_name, n.updated_at, n.bookmark_url, n.bookmark_title
    FROM notes_fts fts
    JOIN notes n ON fts.rowid = n.id
    JOIN folders f ON n.folder_id = f.id
    WHERE notes_fts MATCH ?
      AND n.bookmark_url IS NULL
      ${sql}
    ORDER BY rank
    LIMIT 6
  `).bind(words, ...params).all<NoteSearchResult>();
  return result.results ?? [];
}

async function retrieveBookmarks(
  db: D1Database,
  tokens: string[],
  scope: ChatScope,
): Promise<NoteSearchResult[]> {
  const { sql, params } = noteScopeCondition(scope);
  let where = 'n.bookmark_url IS NOT NULL';
  const binds: string[] = [...params];
  if (tokens.length > 0) {
    const parts = tokens.map(() => `(lower(n.title) LIKE ? ESCAPE '\\' OR lower(COALESCE(n.bookmark_title, '')) LIKE ? ESCAPE '\\' OR lower(COALESCE(n.bookmark_url, '')) LIKE ? ESCAPE '\\' OR lower(COALESCE(n.content, '')) LIKE ? ESCAPE '\\')`);
    where += ` AND (${parts.join(' OR ')})`;
    tokens.forEach(token => {
      const like = `%${escapeLike(token)}%`;
      binds.push(like, like, like, like);
    });
  }

  const result = await db.prepare(`
    SELECT n.id, n.title, n.content, f.name AS folder_name, n.updated_at, n.bookmark_url, n.bookmark_title
    FROM notes n
    JOIN folders f ON n.folder_id = f.id
    WHERE ${where}
      ${sql}
    ORDER BY n.updated_at DESC
    LIMIT 6
  `).bind(...binds).all<NoteSearchResult>();
  return result.results ?? [];
}

async function retrieveTasks(
  db: D1Database,
  tokens: string[],
  scope: ChatScope,
): Promise<TaskSearchResult[]> {
  const { sql, params } = taskScopeCondition(scope);
  let where = '1 = 1';
  const binds: string[] = [...params];
  if (tokens.length > 0) {
    const parts = tokens.map(() => `(lower(t.title) LIKE ? ESCAPE '\\' OR lower(COALESCE(t.description, '')) LIKE ? ESCAPE '\\' OR lower(COALESCE(n.title, '')) LIKE ? ESCAPE '\\')`);
    where += ` AND (${parts.join(' OR ')})`;
    tokens.forEach(token => {
      const like = `%${escapeLike(token)}%`;
      binds.push(like, like, like);
    });
  }

  const result = await db.prepare(`
    SELECT t.id, t.title, t.description, t.status, t.created_at, t.completed_at, t.note_id, n.title AS note_title
    FROM tasks t
    LEFT JOIN notes n ON t.note_id = n.id
    WHERE ${where}
      ${sql}
    ORDER BY
      CASE t.status
        WHEN 'doing' THEN 0
        WHEN 'backlog' THEN 1
        ELSE 2
      END,
      COALESCE(t.completed_at, t.created_at) DESC
    LIMIT 6
  `).bind(...binds).all<TaskSearchResult>();
  return result.results ?? [];
}

app.post('/', async (c) => {
  const body = await c.req.json<{ message: string; history?: HistoryMessage[]; scope?: ChatScope }>();
  if (!body.message?.trim()) {
    return c.json({ error: 'Message required' }, 400);
  }

  const db = c.env.DB as D1Database;
  const history = (body.history ?? []).slice(-10);
  const scope = body.scope ?? { scope: 'all' as const };

  const [aiCfg, prefs] = await Promise.all([getAIConfig(c.env), getUserPrefs(c.env)]);
  if (!aiCfg) return c.json({ error: 'OpenRouter API key not configured' }, 400);
  const { apiKey, model } = aiCfg;

  const expandedTerms = await expandQuery(body.message, apiKey, model);
  const tokens = keywordTokens(expandedTerms || body.message);
  const words = tokens.map(word => word.replace(/"/g, '')).join(' OR ');

  const wantsNotes = scope.scope === 'notes' || scope.scope === 'all' || scope.scope === 'today' || scope.scope === 'this_week' || scope.scope === 'custom';
  const wantsTasks = scope.scope === 'tasks' || scope.scope === 'all' || scope.scope === 'today' || scope.scope === 'this_week' || scope.scope === 'custom';
  const wantsBookmarks = scope.scope === 'bookmarks' || scope.scope === 'all' || scope.scope === 'today' || scope.scope === 'this_week' || scope.scope === 'custom';

  const [notes, tasks, bookmarks] = await Promise.all([
    wantsNotes ? retrieveNotes(db, words, scope) : Promise.resolve([]),
    wantsTasks ? retrieveTasks(db, tokens, scope) : Promise.resolve([]),
    wantsBookmarks ? retrieveBookmarks(db, tokens, scope) : Promise.resolve([]),
  ]);

  const sources: RetrievalSource[] = [
    ...notes.map(note => ({
      id: note.id,
      type: 'note' as const,
      title: note.title,
      subtitle: `#${note.folder_name}`,
      note_id: note.id,
    })),
    ...tasks.map(task => ({
      id: task.id,
      type: 'task' as const,
      title: task.title,
      subtitle: task.status,
      note_id: task.note_id,
    })),
    ...bookmarks.map(bookmark => ({
      id: bookmark.id,
      type: 'bookmark' as const,
      title: bookmark.bookmark_title || bookmark.title,
      subtitle: bookmark.bookmark_url || undefined,
      note_id: bookmark.id,
      url: bookmark.bookmark_url,
    })),
  ];

  if (sources.length === 0) {
    return c.json({
      content: `I couldn't find enough context in the selected scope (${scope.scope}) to answer that. Try broadening the scope or adding more specific notes, tasks, or bookmarks.`,
      sources: [],
      retrieval: {
        scope,
        counts: { notes: 0, tasks: 0, bookmarks: 0 },
        weak: true,
      },
    });
  }

  const contextBlocks = [
    ...notes.map(noteContext),
    ...tasks.map(taskContext),
    ...bookmarks.map(bookmarkContext),
  ];

  const context = contextBlocks.join('\n\n---\n\n');

  const DEFAULT_CHAT_SYSTEM_PROMPT = `You are a personal knowledge assistant. You help the user recall, connect, and reason about their own notes, tasks, and bookmarks.

Guidelines:
- Answer based only on the provided sources.
- Cite notes as [Note ID], tasks as [Task ID], and bookmarks as [Bookmark ID].
- If multiple sources are relevant, synthesize them clearly.
- If the provided sources are insufficient, say so directly and avoid guessing.
- Use the source metadata (folder, dates, type, task status, URLs) when it helps.
- Use conversation history for follow-up questions.
- The selected retrieval scope is ${scope.scope}${scope.from || scope.to ? ` (${scope.from ?? '?'} to ${scope.to ?? '?'})` : ''}.

Retrieved sources:
${context}`;

  const systemPrompt = prefs.promptChat
    ? prefs.promptChat.replace('{{notes}}', context)
    : DEFAULT_CHAT_SYSTEM_PROMPT;

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
  return c.json({
    content: data.choices?.[0]?.message?.content ?? '',
    sources,
    retrieval: {
      scope,
      counts: {
        notes: notes.length,
        tasks: tasks.length,
        bookmarks: bookmarks.length,
      },
      weak: sources.length < 2,
    },
  });
});

export default app;
