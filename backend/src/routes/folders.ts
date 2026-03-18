import { Hono } from 'hono';
import type { Env, Folder, CreateFolderRequest } from '../types';

const folders = new Hono<{ Bindings: Env }>();

// Get all folders
folders.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM folders ORDER BY name'
  ).all<Folder>();
  
  return c.json(results || []);
});

// Get folder by ID with notes count
folders.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  
  const folder = await c.env.DB.prepare(
    'SELECT * FROM folders WHERE id = ?'
  ).bind(id).first<Folder>();
  
  if (!folder) {
    return c.json({ error: 'Folder not found' }, 404);
  }
  
  const { results: notes } = await c.env.DB.prepare(
    'SELECT id, title, created_at, updated_at FROM notes WHERE folder_id = ? ORDER BY updated_at DESC'
  ).bind(id).all();
  
  return c.json({ ...folder, notes: notes || [] });
});

// Create folder
folders.post('/', async (c) => {
  const { name } = await c.req.json<CreateFolderRequest>();

  if (!name?.trim()) {
    return c.json({ error: 'Name is required' }, 400);
  }

  const folderName = name.trim();

  try {
    // Try to insert the folder. Use INSERT OR IGNORE to handle existing folders gracefully.
    await c.env.DB.prepare(
      'INSERT OR IGNORE INTO folders (name) VALUES (?)'
    ).bind(folderName).run();

    // Fetch the folder (whether it was just created or already existed)
    const folder = await c.env.DB.prepare(
      'SELECT * FROM folders WHERE name = ?'
    ).bind(folderName).first<Folder>();

    return c.json(folder, 201);
  } catch (err) {
    console.error('Database error in folders.post:', err);
    return c.json({ error: 'Database error' }, 500);
  }
});

// Update folder
folders.patch('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const body = await c.req.json<Partial<CreateFolderRequest>>();
  
  if (!body.name?.trim()) {
    return c.json({ error: 'Folder name is required' }, 400);
  }
  
  try {
    const result = await c.env.DB.prepare(
      'UPDATE folders SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING *'
    ).bind(body.name.trim(), id).first<Folder>();
    
    if (!result) {
      return c.json({ error: 'Folder not found' }, 404);
    }
    
    return c.json(result);
  } catch (e) {
    return c.json({ error: 'Folder name already exists' }, 409);
  }
});

// Delete folder
folders.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  
  // Don't allow deleting the default Inbox folder
  if (id === 1) {
    return c.json({ error: 'Cannot delete default Inbox folder' }, 400);
  }
  
  const result = await c.env.DB.prepare(
    'DELETE FROM folders WHERE id = ? RETURNING *'
  ).bind(id).first();
  
  if (!result) {
    return c.json({ error: 'Folder not found' }, 404);
  }
  
  return c.json({ success: true });
});

export default folders;
