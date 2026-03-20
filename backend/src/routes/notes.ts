import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { CreateNoteSchema, UpdateNoteSchema, NoteQuerySchema } from '../validators';
import type { Env, Note, NoteWithFolder, PaginatedResponse } from '../types';
import type { z } from 'zod';

const notes = new Hono<{ Bindings: Env }>();

// Whitelist of updateable columns
const UPDATEABLE_COLUMNS = ['title', 'content', 'folder_id', 'is_pinned'] as const;

// Get all notes with pagination
notes.get('/', async (c) => {
  const queryData = {
    page: c.req.query('page'),
    limit: c.req.query('limit'),
    folder_id: c.req.query('folder_id'),
  };
  
  const parsed = NoteQuerySchema.safeParse(queryData);
  if (!parsed.success) {
    return c.json({ success: false, error: 'Validation error', details: parsed.error.errors }, 400);
  }
  
  const { page, limit, folder_id } = parsed.data;
  const db = c.env.DB;
  const offset = (page - 1) * limit;
  
  // Build query dynamically but safely
  let whereClause = '';
  const bindings: (number | string)[] = [];
  
  if (folder_id) {
    whereClause = 'WHERE n.folder_id = ?1';
    bindings.push(folder_id);
  }
  
  // Get data and count in parallel
  const dataQuery = `
    SELECT n.*, f.name as folder_name 
    FROM notes n 
    JOIN folders f ON n.folder_id = f.id
    ${whereClause}
    ORDER BY n.is_pinned DESC, n.updated_at DESC  // CHANGED
    LIMIT ?${bindings.length + 1} OFFSET ?${bindings.length + 2}
  `;
  
  const countQuery = `SELECT COUNT(*) as total FROM notes n ${whereClause}`;
  
  bindings.push(limit, offset);
  
  const [dataResult, countResult] = await Promise.all([
    db.prepare(dataQuery).bind(...bindings).all<NoteWithFolder>(),
    db.prepare(countQuery).bind(...bindings.slice(0, -2)).first<{ total: number }>(),
  ]);
  
  const response: PaginatedResponse<NoteWithFolder> = {
    data: dataResult.results || [],
    pagination: {
      page,
      limit,
      total: countResult?.total || 0,
      totalPages: Math.ceil((countResult?.total || 0) / limit),
    },
  };
  
  return c.json(response);
});

// Get note by ID
notes.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  
  if (isNaN(id)) {
    return c.json({ success: false, error: 'Invalid note ID' }, 400);
  }
  
  const db = c.env.DB;
  
  const note = await db.prepare(`
    SELECT n.*, f.name as folder_name 
    FROM notes n 
    JOIN folders f ON n.folder_id = f.id 
    WHERE n.id = ?1
  `).bind(id).first<NoteWithFolder>();
  
  if (!note) {
    return c.json({ success: false, error: 'Note not found' }, 404);
  }
  
  return c.json({ success: true, data: note });
});

// Create note (TODO: Add authMiddleware when frontend has auth)
notes.post('/', async (c) => {
  const body = await c.req.json();
  const parsed = CreateNoteSchema.safeParse(body);
  
  if (!parsed.success) {
    return c.json({ success: false, error: 'Validation error', details: parsed.error.errors }, 400);
  }
  
  const data = parsed.data;
  const db = c.env.DB;
  
  // Verify folder exists
  const folder = await db.prepare('SELECT id FROM folders WHERE id = ?1')
    .bind(data.folder_id)
    .first();
  
  if (!folder) {
    return c.json({ success: false, error: 'Folder not found' }, 404);
  }
  
  const result = await db.prepare(`
    INSERT INTO notes (folder_id, title, content, created_at, updated_at) 
    VALUES (?1, ?2, ?3, datetime('now'), datetime('now')) 
    RETURNING *
  `).bind(data.folder_id, data.title, data.content || '')
    .first<Note>();
  
  return c.json({ success: true, data: result }, 201);
});

// Update note (TODO: Add authMiddleware when frontend has auth) - SQL INJECTION FIX
notes.patch('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  
  if (isNaN(id)) {
    return c.json({ success: false, error: 'Invalid note ID' }, 400);
  }
  
  const body = await c.req.json();
  const parsed = UpdateNoteSchema.safeParse(body);
  
  if (!parsed.success) {
    return c.json({ success: false, error: 'Validation error', details: parsed.error.errors }, 400);
  }
  
  const data = parsed.data;
  const db = c.env.DB;
  
  // Build update query safely using column whitelist
  const updates: string[] = [];
  const values: (string | number)[] = [];
  let paramIndex = 1;
  
  // Only allow whitelisted columns
  for (const col of UPDATEABLE_COLUMNS) {
    const colValue = data[col as keyof z.infer<typeof UpdateNoteSchema>];
    if (colValue !== undefined) {
      updates.push(`${col} = ?${paramIndex}`);
      values.push(colValue as string | number);
      paramIndex++;
    }
  }
  
  if (updates.length === 0) {
    return c.json({ success: false, error: 'No valid fields to update' }, 400);
  }
  
  // Add updated_at and id
  updates.push(`updated_at = datetime('now')`);
  values.push(id);
  
  const query = `UPDATE notes SET ${updates.join(', ')} WHERE id = ?${paramIndex} RETURNING *`;
  
  const result = await db.prepare(query).bind(...values).first<Note>();
  
  if (!result) {
    return c.json({ success: false, error: 'Note not found' }, 404);
  }
  
  return c.json({ success: true, data: result });
});

// Delete note (TODO: Add authMiddleware when frontend has auth)
notes.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  
  if (isNaN(id)) {
    return c.json({ success: false, error: 'Invalid note ID' }, 400);
  }
  
  const db = c.env.DB;
  
  const result = await db.prepare('DELETE FROM notes WHERE id = ?1 RETURNING *')
    .bind(id)
    .first();
  
  if (!result) {
    return c.json({ success: false, error: 'Note not found' }, 404);
  }
  
  return c.json({ success: true, data: { id } });
});

export default notes;
