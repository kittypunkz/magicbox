import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { CreateFolderSchema, UpdateFolderSchema } from '../validators';
import type { Env, Folder } from '../types';

const folders = new Hono<{ Bindings: Env }>();

// Get all folders
folders.get('/', async (c) => {
  const db = c.env.DB;
  const { results } = await db.prepare(
    'SELECT * FROM folders ORDER BY name'
  ).all<Folder>();
  
  return c.json({ success: true, data: results || [] });
});

// Get folder by ID with notes count
folders.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  
  if (isNaN(id)) {
    return c.json({ success: false, error: 'Invalid folder ID' }, 400);
  }
  
  const db = c.env.DB;
  
  const folder = await db.prepare(
    'SELECT * FROM folders WHERE id = ?1'
  ).bind(id).first<Folder>();
  
  if (!folder) {
    return c.json({ success: false, error: 'Folder not found' }, 404);
  }
  
  const { results: notes } = await db.prepare(`
    SELECT id, title, is_pinned, created_at, updated_at 
    FROM notes 
    WHERE folder_id = ?1 
    ORDER BY is_pinned DESC, updated_at DESC
  `).bind(id).all();
  
  return c.json({ 
    success: true, 
    data: { 
      ...folder, 
      notes: notes || [] 
    } 
  });
});

// Create folder (TODO: Add authMiddleware when frontend has auth)
folders.post('/', async (c) => {
  const body = await c.req.json();
  const parsed = CreateFolderSchema.safeParse(body);
  
  if (!parsed.success) {
    return c.json({ success: false, error: 'Validation error', details: parsed.error.errors }, 400);
  }
  
  const { name } = parsed.data;
  const db = c.env.DB;

  try {
    // Try to insert the folder. Use INSERT OR IGNORE to handle existing folders gracefully.
    await db.prepare(
      'INSERT OR IGNORE INTO folders (name) VALUES (?1)'
    ).bind(name).run();

    // Fetch the folder (whether it was just created or already existed)
    const folder = await db.prepare(
      'SELECT * FROM folders WHERE name = ?1'
    ).bind(name).first<Folder>();

    return c.json({ success: true, data: folder }, 201);
  } catch (err) {
    console.error('Database error in folders.post:', err);
    return c.json({ success: false, error: 'Database error' }, 500);
  }
});

// Update folder (TODO: Add authMiddleware when frontend has auth)
folders.patch('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  
  if (isNaN(id)) {
    return c.json({ success: false, error: 'Invalid folder ID' }, 400);
  }
  
  const body = await c.req.json();
  const parsed = UpdateFolderSchema.safeParse(body);
  
  if (!parsed.success) {
    return c.json({ success: false, error: 'Validation error', details: parsed.error.errors }, 400);
  }
  
  const { name } = parsed.data;
  const db = c.env.DB;
  
  // Don't allow updating the default Inbox folder
  if (id === 1) {
    return c.json({ success: false, error: 'Cannot rename default Inbox folder' }, 400);
  }
  
  try {
    const result = await db.prepare(`
      UPDATE folders 
      SET name = ?1, updated_at = datetime('now') 
      WHERE id = ?2 
      RETURNING *
    `).bind(name, id).first<Folder>();
    
    if (!result) {
      return c.json({ success: false, error: 'Folder not found' }, 404);
    }
    
    return c.json({ success: true, data: result });
  } catch (e) {
    return c.json({ success: false, error: 'Folder name already exists' }, 409);
  }
});

// Delete folder (TODO: Add authMiddleware when frontend has auth)
folders.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  
  if (isNaN(id)) {
    return c.json({ success: false, error: 'Invalid folder ID' }, 400);
  }
  
  const db = c.env.DB;
  
  // Don't allow deleting the default Inbox folder
  if (id === 1) {
    return c.json({ success: false, error: 'Cannot delete default Inbox folder' }, 400);
  }
  
  const result = await db.prepare(
    'DELETE FROM folders WHERE id = ?1 RETURNING *'
  ).bind(id).first();
  
  if (!result) {
    return c.json({ success: false, error: 'Folder not found' }, 404);
  }
  
  return c.json({ success: true, data: { id } });
});

export default folders;
