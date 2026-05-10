import { Hono } from 'hono';
import type { Env } from '../types';
import { sessionAuthMiddleware } from '../middleware/auth';
import { CreateTaskSchema, UpdateTaskSchema, TaskQuerySchema, CreateSubtaskSchema, UpdateSubtaskSchema, SummaryQuerySchema } from '../validators/schemas';

interface Task {
  id: number;
  note_id: number | null;
  note_title: string | null;
  description: string | null;
  title: string;
  status: 'backlog' | 'doing' | 'done';
  created_at: string;
  completed_at: string | null;
  subtask_count: number;
  subtask_done_count: number;
}

interface Subtask {
  id: number;
  task_id: number;
  title: string;
  done: number;
  created_at: string;
}

const LIST_SQL = `
  SELECT t.*, n.title as note_title,
    COUNT(s.id) as subtask_count,
    COALESCE(SUM(s.done), 0) as subtask_done_count
  FROM tasks t
  LEFT JOIN notes n ON t.note_id = n.id
  LEFT JOIN subtasks s ON s.task_id = t.id
`;

const DETAIL_SQL = `
  SELECT t.*, n.title as note_title,
    COUNT(s.id) as subtask_count,
    COALESCE(SUM(s.done), 0) as subtask_done_count
  FROM tasks t
  LEFT JOIN notes n ON t.note_id = n.id
  LEFT JOIN subtasks s ON s.task_id = t.id
  WHERE t.id = ?
  GROUP BY t.id
`;

const app = new Hono<{ Bindings: Env }>();

app.use('*', sessionAuthMiddleware);

// GET /tasks?status=pending|done
const attachSubtasks = async (db: D1Database, tasks: Task[]) => {
  const ids = tasks.filter(t => t.subtask_count > 0).map(t => t.id);
  const subtaskMap: Record<number, Subtask[]> = {};
  if (ids.length > 0) {
    const ph = ids.map(() => '?').join(',');
    const res = await db.prepare(
      `SELECT * FROM subtasks WHERE task_id IN (${ph}) ORDER BY created_at ASC`
    ).bind(...ids).all<Subtask>();
    for (const s of res.results ?? []) {
      if (!subtaskMap[s.task_id]) subtaskMap[s.task_id] = [];
      subtaskMap[s.task_id].push(s);
    }
  }
  return tasks.map(t => ({ ...t, subtasks: subtaskMap[t.id] ?? [] }));
};

app.get('/', async (c) => {
  const query = TaskQuerySchema.safeParse(c.req.query());
  if (!query.success) {
    return c.json({ error: query.error.flatten() }, 400);
  }

  const db = c.env.DB as D1Database;
  let sql = LIST_SQL;
  const params: (string | number)[] = [];
  const conditions: string[] = [];

  if (query.data.status) conditions.push('t.status = ?') && params.push(query.data.status);
  if (query.data.note_id) conditions.push('t.note_id = ?') && params.push(query.data.note_id);

  if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
  sql += ' GROUP BY t.id ORDER BY t.created_at DESC';

  const result = await db.prepare(sql).bind(...params).all<Task>();
  const tasks = await attachSubtasks(db, result.results ?? []);
  return c.json({ tasks });
});

// GET /tasks/summary — today's or custom-range snapshot (Bangkok UTC+7) — must be before /:id
app.get('/summary', async (c) => {
  const query = SummaryQuerySchema.safeParse(c.req.query());
  if (!query.success) return c.json({ error: query.error.flatten() }, 400);

  const db = c.env.DB as D1Database;
  const todayBKK = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const { from, to } = query.data;
  const effectiveFrom = from ?? todayBKK;
  const effectiveTo   = to   ?? todayBKK;
  const isPeriod = !!(from || to);

  const DONE_SQL = `${LIST_SQL}
    WHERE t.status = 'done'
      AND date(t.completed_at, '+7 hours') >= ?
      AND date(t.completed_at, '+7 hours') <= ?
    GROUP BY t.id ORDER BY t.completed_at ASC`;

  if (isPeriod) {
    const doneRes = await db.prepare(DONE_SQL).bind(effectiveFrom, effectiveTo).all<Task>();
    return c.json({
      date: effectiveTo,
      from: effectiveFrom,
      to: effectiveTo,
      backlog: [],
      doing: [],
      added_today: [],
      carry_over: [],
      done_today: await attachSubtasks(db, doneRes.results ?? []),
    });
  }

  const [backlogRes, doingRes, doneRes, addedTodayRes, carryOverRes] = await Promise.all([
    db.prepare(`${LIST_SQL} WHERE t.status = 'backlog' GROUP BY t.id ORDER BY t.created_at DESC`).all<Task>(),
    db.prepare(`${LIST_SQL} WHERE t.status = 'doing' GROUP BY t.id ORDER BY t.created_at DESC`).all<Task>(),
    db.prepare(DONE_SQL).bind(todayBKK, todayBKK).all<Task>(),
    db.prepare(
      `${LIST_SQL}
       WHERE date(t.created_at, '+7 hours') = ?
       GROUP BY t.id
       ORDER BY t.created_at DESC`
    ).bind(todayBKK).all<Task>(),
    db.prepare(
      `${LIST_SQL}
       WHERE t.status IN ('backlog', 'doing')
         AND date(t.created_at, '+7 hours') < ?
       GROUP BY t.id
       ORDER BY
         CASE t.status
           WHEN 'doing' THEN 0
           WHEN 'backlog' THEN 1
           ELSE 2
         END,
         t.created_at ASC`
    ).bind(todayBKK).all<Task>(),
  ]);

  const [backlog, doing, done_today, added_today, carry_over] = await Promise.all([
    attachSubtasks(db, backlogRes.results ?? []),
    attachSubtasks(db, doingRes.results ?? []),
    attachSubtasks(db, doneRes.results ?? []),
    attachSubtasks(db, addedTodayRes.results ?? []),
    attachSubtasks(db, carryOverRes.results ?? []),
  ]);

  return c.json({
    date: todayBKK,
    from: todayBKK,
    to: todayBKK,
    backlog,
    doing,
    added_today,
    carry_over,
    done_today,
  });
});

// GET /tasks/:id — single task with subtasks
app.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  if (isNaN(id)) return c.json({ error: 'Invalid id' }, 400);

  const db = c.env.DB as D1Database;
  const [task, subtasksRes] = await Promise.all([
    db.prepare(DETAIL_SQL).bind(id).first<Task>(),
    db.prepare('SELECT * FROM subtasks WHERE task_id = ? ORDER BY created_at ASC').bind(id).all<Subtask>(),
  ]);

  if (!task) return c.json({ error: 'Task not found' }, 404);
  return c.json({ task: { ...task, subtasks: subtasksRes.results ?? [] } });
});

// POST /tasks
app.post('/', async (c) => {
  const body = await c.req.json();
  const parsed = CreateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const db = c.env.DB as D1Database;
  const { title, note_id, status, description } = parsed.data;

  const result = await db.prepare(
    'INSERT INTO tasks (title, note_id, status, description) VALUES (?, ?, ?, ?) RETURNING *'
  ).bind(title, note_id ?? null, status ?? 'backlog', description ?? null).first<Task>();

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
  const { title, status, note_id, description } = parsed.data;

  const sets: string[] = [];
  const params: (string | number | null)[] = [];

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
  if (note_id !== undefined) { sets.push('note_id = ?'); params.push(note_id); }
  if (description !== undefined) { sets.push('description = ?'); params.push(description); }

  params.push(String(id));
  const task = await db.prepare(
    `UPDATE tasks SET ${sets.join(', ')} WHERE id = ? RETURNING *`
  ).bind(...params).first<Task>();

  if (!task) return c.json({ error: 'Task not found' }, 404);

  const taskWithNote = await db.prepare(DETAIL_SQL).bind(task.id).first<Task>();
  return c.json({ task: taskWithNote ?? task });
});

// POST /tasks/:id/subtasks
app.post('/:id/subtasks', async (c) => {
  const taskId = parseInt(c.req.param('id'));
  if (isNaN(taskId)) return c.json({ error: 'Invalid id' }, 400);

  const body = await c.req.json();
  const parsed = CreateSubtaskSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

  const db = c.env.DB as D1Database;
  const subtask = await db.prepare(
    'INSERT INTO subtasks (task_id, title) VALUES (?, ?) RETURNING *'
  ).bind(taskId, parsed.data.title).first<Subtask>();

  return c.json({ subtask }, 201);
});

// PATCH /tasks/:id/subtasks/:subId
app.patch('/:id/subtasks/:subId', async (c) => {
  const taskId = parseInt(c.req.param('id'));
  const subId = parseInt(c.req.param('subId'));
  if (isNaN(taskId) || isNaN(subId)) return c.json({ error: 'Invalid id' }, 400);

  const body = await c.req.json();
  const parsed = UpdateSubtaskSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

  const db = c.env.DB as D1Database;
  const { title, done } = parsed.data;

  const sets: string[] = [];
  const params: (string | number | null)[] = [];

  if (title !== undefined) { sets.push('title = ?'); params.push(title); }
  if (done !== undefined) { sets.push('done = ?'); params.push(done ? 1 : 0); }

  params.push(String(subId), String(taskId));
  const subtask = await db.prepare(
    `UPDATE subtasks SET ${sets.join(', ')} WHERE id = ? AND task_id = ? RETURNING *`
  ).bind(...params).first<Subtask>();

  if (!subtask) return c.json({ error: 'Subtask not found' }, 404);
  return c.json({ subtask });
});

// DELETE /tasks/:id/subtasks/:subId
app.delete('/:id/subtasks/:subId', async (c) => {
  const taskId = parseInt(c.req.param('id'));
  const subId = parseInt(c.req.param('subId'));
  if (isNaN(taskId) || isNaN(subId)) return c.json({ error: 'Invalid id' }, 400);

  const db = c.env.DB as D1Database;
  const result = await db.prepare(
    'DELETE FROM subtasks WHERE id = ? AND task_id = ?'
  ).bind(subId, taskId).run();

  if (!result.meta.changes) return c.json({ error: 'Subtask not found' }, 404);
  return c.json({ success: true });
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
