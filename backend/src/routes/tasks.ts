import { Hono } from 'hono';
import type { Env } from '../types';
import { sessionAuthMiddleware } from '../middleware/auth';
import { CreateTaskSchema, UpdateTaskSchema, TaskQuerySchema } from '../validators/schemas';

interface Task {
  id: number;
  note_id: number | null;
  title: string;
  status: 'backlog' | 'doing' | 'done';
  created_at: string;
  completed_at: string | null;
}

const app = new Hono<{ Bindings: Env }>();

app.use('*', sessionAuthMiddleware);

// GET /tasks?status=pending|done
app.get('/', async (c) => {
  const query = TaskQuerySchema.safeParse(c.req.query());
  if (!query.success) {
    return c.json({ error: query.error.flatten() }, 400);
  }

  const db = c.env.DB as D1Database;
  let sql = 'SELECT * FROM tasks';
  const params: string[] = [];

  if (query.data.status) {
    sql += ' WHERE status = ?';
    params.push(query.data.status);
  }

  sql += ' ORDER BY created_at DESC';

  const result = await db.prepare(sql).bind(...params).all<Task>();
  return c.json({ tasks: result.results ?? [] });
});

// POST /tasks
app.post('/', async (c) => {
  const body = await c.req.json();
  const parsed = CreateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const db = c.env.DB as D1Database;
  const { title, note_id, status } = parsed.data;

  const result = await db.prepare(
    'INSERT INTO tasks (title, note_id, status) VALUES (?, ?, ?) RETURNING *'
  ).bind(title, note_id ?? null, status ?? 'backlog').first<Task>();

  return c.json({ task: result }, 201);
});

// PATCH /tasks/:id
app.patch('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  if (isNaN(id)) return c.json({ error: 'Invalid id' }, 400);

  const body = await c.req.json();
  const parsed = UpdateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const db = c.env.DB as D1Database;
  const { title, status } = parsed.data;

  const sets: string[] = [];
  const params: (string | null)[] = [];

  if (title !== undefined) { sets.push('title = ?'); params.push(title); }
  if (status !== undefined) {
    sets.push('status = ?');
    params.push(status);
    if (status === 'done') {
      sets.push('completed_at = datetime("now")');
    } else {
      sets.push('completed_at = NULL');
    }

  }

  params.push(String(id));
  const task = await db.prepare(
    `UPDATE tasks SET ${sets.join(', ')} WHERE id = ? RETURNING *`
  ).bind(...params).first<Task>();

  if (!task) return c.json({ error: 'Task not found' }, 404);
  return c.json({ task });
});

// GET /tasks/summary — today's snapshot (Bangkok UTC+7)
app.get('/summary', async (c) => {
  const db = c.env.DB as D1Database;

  const [backlogRes, doingRes, doneRes] = await Promise.all([
    db.prepare("SELECT * FROM tasks WHERE status = 'backlog' ORDER BY created_at DESC").all<Task>(),
    db.prepare("SELECT * FROM tasks WHERE status = 'doing' ORDER BY created_at DESC").all<Task>(),
    db.prepare(
      "SELECT * FROM tasks WHERE status = 'done' AND date(completed_at, '+7 hours') = date('now', '+7 hours') ORDER BY completed_at DESC"
    ).all<Task>(),
  ]);

  const today = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);

  return c.json({
    date: today,
    backlog: backlogRes.results ?? [],
    doing: doingRes.results ?? [],
    done_today: doneRes.results ?? [],
  });
});

// DELETE /tasks/:id
app.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  if (isNaN(id)) return c.json({ error: 'Invalid id' }, 400);

  const db = c.env.DB as D1Database;
  const result = await db.prepare('DELETE FROM tasks WHERE id = ?').bind(id).run();

  if (!result.meta.changes) return c.json({ error: 'Task not found' }, 404);
  return c.json({ success: true });
});

export default app;
