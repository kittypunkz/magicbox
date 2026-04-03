import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getCookie } from 'hono/cookie';

type Bindings = {
  DB: D1Database;
};

const tags = new Hono<{ Bindings: Bindings }>();

// Get all tags with note counts
tags.get('/', async (c) => {
  const sessionToken = getCookie(c, 'session');
  
  if (!sessionToken) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const tagsResult = await c.env.DB.prepare(`
      SELECT t.*, 
        (SELECT COUNT(*) FROM notes WHERE tags LIKE '%' || t.name || '%') as note_count
      FROM tags t
      ORDER BY t.pinned DESC, t.name ASC
    `).all();

    return c.json({ tags: tagsResult.results });
  } catch (error) {
    console.error('Error fetching tags:', error);
    return c.json({ error: 'Failed to fetch tags' }, 500);
  }
});

// Get single tag by name
tags.get('/:name', async (c) => {
  const sessionToken = getCookie(c, 'session');
  const tagName = c.req.param('name');
  
  if (!sessionToken) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const tagResult = await c.env.DB.prepare(`
      SELECT * FROM tags WHERE name = ?
    `).bind(tagName).first();

    if (!tagResult) {
      return c.json({ error: 'Tag not found' }, 404);
    }

    // Get notes with this tag
    const notesResult = await c.env.DB.prepare(`
      SELECT id, title, content, updated_at, is_pinned
      FROM notes
      WHERE tags LIKE ?
      ORDER BY is_pinned DESC, updated_at DESC
    `).bind(`%${tagName}%`).all();

    return c.json({ 
      tag: tagResult,
      notes: notesResult.results 
    });
  } catch (error) {
    console.error('Error fetching tag:', error);
    return c.json({ error: 'Failed to fetch tag' }, 500);
  }
});

// Create new tag
tags.post('/', async (c) => {
  const sessionToken = getCookie(c, 'session');
  
  if (!sessionToken) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const { name, color, icon } = await c.req.json();
    
    if (!name) {
      return c.json({ error: 'Tag name is required' }, 400);
    }

    const result = await c.env.DB.prepare(`
      INSERT INTO tags (name, color, icon, pinned)
      VALUES (?, ?, ?, 0)
    `).bind(name, color || '#3b82f6', icon || null).run();

    return c.json({ 
      success: true, 
      id: result.meta.last_insert_rowid 
    }, 201);
  } catch (error) {
    console.error('Error creating tag:', error);
    return c.json({ error: 'Failed to create tag' }, 500);
  }
});

// Update tag (pin/unpin)
tags.put('/:id', async (c) => {
  const sessionToken = getCookie(c, 'session');
  const tagId = c.req.param('id');
  
  if (!sessionToken) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const { pinned } = await c.req.json();

    await c.env.DB.prepare(`
      UPDATE tags SET pinned = ? WHERE id = ?
    `).bind(pinned ? 1 : 0, tagId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error updating tag:', error);
    return c.json({ error: 'Failed to update tag' }, 500);
  }
});

// Delete tag
tags.delete('/:id', async (c) => {
  const sessionToken = getCookie(c, 'session');
  const tagId = c.req.param('id');
  
  if (!sessionToken) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    await c.env.DB.prepare(`DELETE FROM tags WHERE id = ?`).bind(tagId).run();
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting tag:', error);
    return c.json({ error: 'Failed to delete tag' }, 500);
  }
});

export default tags;