import { Hono } from 'hono';
import type { Env, Note, NoteWithFolder, CreateNoteRequest, UpdateNoteRequest } from '../types';

const notes = new Hono<{ Bindings: Env }>();

// Get all notes (with optional folder filter)
notes.get('/', async (c) => {
  const folderId = c.req.query('folder_id');
  const db = c.env.DB as D1Database;
  
  let query = `
    SELECT n.*, f.name as folder_name 
    FROM notes n 
    JOIN folders f ON n.folder_id = f.id
  `;
  
  if (folderId) {
    query += ' WHERE n.folder_id = ?';
  }
  
  query += ' ORDER BY n.updated_at DESC';
  
  const stmt = folderId 
    ? db.prepare(query).bind(parseInt(folderId))
    : db.prepare(query);
  
  const { results } = await stmt.all<NoteWithFolder>();
  
  return c.json(results || []);
});

// Get note by ID
notes.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const db = c.env.DB as D1Database;
  
  const note = await db.prepare(`
    SELECT n.*, f.name as folder_name 
    FROM notes n 
    JOIN folders f ON n.folder_id = f.id 
    WHERE n.id = ?
  `).bind(id).first<NoteWithFolder>();
  
  if (!note) {
    return c.json({ error: 'Note not found' }, 404);
  }
  
  return c.json(note);
});

// Create note
notes.post('/', async (c) => {
  const body = await c.req.json<CreateNoteRequest>();
  const db = c.env.DB as D1Database;
  
  if (!body.title?.trim()) {
    return c.json({ error: 'Title is required' }, 400);
  }
  
  const folderId = body.folder_id || 1; // Default to Inbox
  
  // Verify folder exists
  const folder = await db.prepare(
    'SELECT id FROM folders WHERE id = ?'
  ).bind(folderId).first();
  
  if (!folder) {
    return c.json({ error: 'Folder not found' }, 404);
  }
  
  const result = await db.prepare(
    'INSERT INTO notes (folder_id, title, content) VALUES (?, ?, ?) RETURNING *'
  ).bind(folderId, body.title.trim(), body.content || '').first<Note>();
  
  return c.json(result, 201);
});

// Update note
notes.patch('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const body = await c.req.json<UpdateNoteRequest>();
  const db = c.env.DB as D1Database;
  
  // Build dynamic update query
  const updates: string[] = [];
  const values: (string | number)[] = [];
  
  if (body.title !== undefined) {
    updates.push('title = ?');
    values.push(body.title.trim());
  }
  
  if (body.content !== undefined) {
    updates.push('content = ?');
    values.push(body.content);
  }
  
  if (body.folder_id !== undefined) {
    updates.push('folder_id = ?');
    values.push(body.folder_id);
  }
  
  if (updates.length === 0) {
    return c.json({ error: 'No fields to update' }, 400);
  }
  
  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  
  const result = await db.prepare(
    `UPDATE notes SET ${updates.join(', ')} WHERE id = ? RETURNING *`
  ).bind(...values).first<Note>();
  
  if (!result) {
    return c.json({ error: 'Note not found' }, 404);
  }
  
  return c.json(result);
});

// Delete note
notes.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const db = c.env.DB as D1Database;
  
  const result = await db.prepare(
    'DELETE FROM notes WHERE id = ? RETURNING *'
  ).bind(id).first();
  
  if (!result) {
    return c.json({ error: 'Note not found' }, 404);
  }
  
  return c.json({ success: true });
});

export default notes;
