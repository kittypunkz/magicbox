import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getCookie } from 'hono/cookie';
import type { Tag, TagWithCount } from '../types';

type Bindings = {
  DB: D1Database;
};

const tags = new Hono<{ Bindings: Bindings }>();

/**
 * Ensure all parent tags exist in the tags table.
 * For "work/client/apple", creates "work" and "work/client" if they don't exist.
 */
async function ensureParentTags(db: D1Database, fullPath: string): Promise<void> {
  const segments = fullPath.split('/');
  
  // Build all parent paths
  const parentPaths: string[] = [];
  for (let i = 1; i < segments.length; i++) {
    parentPaths.push(segments.slice(0, i).join('/'));
  }

  // Insert missing parent tags
  for (const parentPath of parentPaths) {
    try {
      await db.prepare(`
        INSERT OR IGNORE INTO tags (name, color, icon, pinned)
        VALUES (?, '#3b82f6', NULL, 0)
      `).bind(parentPath).run();
    } catch (error) {
      // Ignore unique constraint violations
      console.warn(`Parent tag ${parentPath} already exists`);
    }
  }
}

/**
 * Get note count for a tag, optionally including descendants.
 * For "work", this counts notes tagged "work", "work/client", "work/client/apple", etc.
 */
async function getNoteCountForTag(db: D1Database, tagName: string, includeDescendants = false): Promise<number> {
  if (includeDescendants) {
    // Count notes that have this tag or any descendant tag
    const result = await db.prepare(`
      SELECT COUNT(DISTINCT n.id) as cnt
      FROM notes n, json_each(n.tags)
      WHERE json_each.value = ? OR json_each.value LIKE ?
    `).bind(tagName, `${tagName}/%`).first<{ cnt: number }>();
    return result?.cnt ?? 0;
  } else {
    // Count notes with exact tag match
    const result = await db.prepare(`
      SELECT COUNT(DISTINCT n.id) as cnt
      FROM notes n, json_each(n.tags)
      WHERE json_each.value = ?
    `).bind(tagName).first<{ cnt: number }>();
    return result?.cnt ?? 0;
  }
}

// Get all tags with note counts
tags.get('/', async (c) => {
  const sessionToken = getCookie(c, 'session');
  
  if (!sessionToken) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    // Get all tags from tags table
    const tagsResult = await c.env.DB.prepare(`
      SELECT * FROM tags
      ORDER BY pinned DESC, name ASC
    `).all<Tag>();

    // Calculate note counts for each tag (exact match, not including descendants)
    const tagsWithCounts: TagWithCount[] = [];
    for (const tag of tagsResult.results) {
      const count = await getNoteCountForTag(c.env.DB, tag.name, false);
      tagsWithCounts.push({
        ...tag,
        note_count: count,
      });
    }

    return c.json({ tags: tagsWithCounts });
  } catch (error) {
    console.error('Error fetching tags:', error);
    return c.json({ error: 'Failed to fetch tags' }, 500);
  }
});

// Search tags by query
tags.get('/search', async (c) => {
  const sessionToken = getCookie(c, 'session');
  const query = c.req.query('q') || '';
  
  if (!sessionToken) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    // Search for tags matching the query (prefix match for nested tags)
    const tagsResult = await c.env.DB.prepare(`
      SELECT * FROM tags
      WHERE name LIKE ?
      ORDER BY pinned DESC, name ASC
      LIMIT 20
    `).bind(`%${query}%`).all<Tag>();

    // Calculate note counts for each tag
    const tagsWithCounts: TagWithCount[] = [];
    for (const tag of tagsResult.results) {
      const count = await getNoteCountForTag(c.env.DB, tag.name, false);
      tagsWithCounts.push({
        ...tag,
        note_count: count,
      });
    }

    return c.json({ tags: tagsWithCounts });
  } catch (error) {
    console.error('Error searching tags:', error);
    return c.json({ error: 'Failed to search tags' }, 500);
  }
});

// Get pinned tags (for sidebar)
tags.get('/pinned', async (c) => {
  const sessionToken = getCookie(c, 'session');
  
  if (!sessionToken) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const tagsResult = await c.env.DB.prepare(`
      SELECT * FROM tags
      WHERE pinned = 1
      ORDER BY name ASC
    `).all<Tag>();

    // Calculate note counts for each tag
    const tagsWithCounts: TagWithCount[] = [];
    for (const tag of tagsResult.results) {
      const count = await getNoteCountForTag(c.env.DB, tag.name, false);
      tagsWithCounts.push({
        ...tag,
        note_count: count,
      });
    }

    return c.json({ tags: tagsWithCounts });
  } catch (error) {
    console.error('Error fetching pinned tags:', error);
    return c.json({ error: 'Failed to fetch pinned tags' }, 500);
  }
});

// Get recent tags (most recently used, based on notes' updated_at)
tags.get('/recent', async (c) => {
  const sessionToken = getCookie(c, 'session');
  
  if (!sessionToken) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    // Get tags from recently updated notes
    const tagsResult = await c.env.DB.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      JOIN notes n ON n.tags LIKE '%' || t.name || '%'
      ORDER BY n.updated_at DESC
      LIMIT 10
    `).all<Tag>();

    // Calculate note counts for each tag
    const tagsWithCounts: TagWithCount[] = [];
    for (const tag of tagsResult.results) {
      const count = await getNoteCountForTag(c.env.DB, tag.name, false);
      tagsWithCounts.push({
        ...tag,
        note_count: count,
      });
    }

    return c.json({ tags: tagsWithCounts });
  } catch (error) {
    console.error('Error fetching recent tags:', error);
    return c.json({ error: 'Failed to fetch recent tags' }, 500);
  }
});

// Get single tag by name with its notes
tags.get('/:name', async (c) => {
  const sessionToken = getCookie(c, 'session');
  const tagName = decodeURIComponent(c.req.param('name'));
  
  if (!sessionToken) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const tagResult = await c.env.DB.prepare(`
      SELECT * FROM tags WHERE name = ?
    `).bind(tagName).first<Tag>();

    // Get notes with this tag or any descendant tag
    const notesResult = await c.env.DB.prepare(`
      SELECT DISTINCT n.*, f.name as folder_name
      FROM notes n
      JOIN folders f ON n.folder_id = f.id
      WHERE EXISTS (
        SELECT 1 FROM json_each(n.tags) 
        WHERE json_each.value = ? OR json_each.value LIKE ?
      )
      ORDER BY n.is_pinned DESC, n.updated_at DESC
    `).bind(tagName, `${tagName}/%`).all();

    // Calculate total count including descendants
    const totalCount = await getNoteCountForTag(c.env.DB, tagName, true);

    return c.json({ 
      tag: tagResult || { name: tagName, color: '#3b82f6', pinned: 0, note_count: totalCount },
      notes: notesResult.results,
      descendant_count: totalCount,
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
    
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return c.json({ error: 'Tag name is required' }, 400);
    }

    const trimmedName = name.trim();

    // Auto-create parent tags for nested tags (e.g., "work/client" → also create "work")
    await ensureParentTags(c.env.DB, trimmedName);

    const result = await c.env.DB.prepare(`
      INSERT INTO tags (name, color, icon, pinned)
      VALUES (?, ?, ?, 0)
    `).bind(trimmedName, color || '#3b82f6', icon || null).run();

    return c.json({ 
      success: true, 
      id: result.meta.last_insert_rowid,
      name: trimmedName
    }, 201);
  } catch (error) {
    // Unique constraint violation
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return c.json({ error: 'Tag already exists' }, 409);
    }
    console.error('Error creating tag:', error);
    return c.json({ error: 'Failed to create tag' }, 500);
  }
});

// Update tag (pin/unpin, color/icon, pin_order)
tags.put('/:id', async (c) => {
  const sessionToken = getCookie(c, 'session');
  const tagId = c.req.param('id');
  
  if (!sessionToken) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const { pinned, color, icon, pin_order } = await c.req.json();

    // Build dynamic update
    const updates: string[] = [];
    const values: (string | number)[] = [];
    let paramIndex = 1;

    if (pinned !== undefined) {
      updates.push(`pinned = ?${paramIndex}`);
      values.push(pinned ? 1 : 0);
      paramIndex++;
    }

    if (color !== undefined) {
      updates.push(`color = ?${paramIndex}`);
      values.push(color);
      paramIndex++;
    }

    if (icon !== undefined) {
      updates.push(`icon = ?${paramIndex}`);
      values.push(icon);
      paramIndex++;
    }

    if (pin_order !== undefined) {
      updates.push(`pin_order = ?${paramIndex}`);
      values.push(pin_order);
      paramIndex++;
    }

    if (updates.length === 0) {
      return c.json({ error: 'No fields to update' }, 400);
    }

    updates.push(`updated_at = datetime('now')`);
    values.push(tagId);

    await c.env.DB.prepare(`
      UPDATE tags SET ${updates.join(', ')} WHERE id = ?
    `).bind(...values).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error updating tag:', error);
    return c.json({ error: 'Failed to update tag' }, 500);
  }
});

// Rename tag (also updates all notes using this tag)
tags.put('/:id/rename', async (c) => {
  const sessionToken = getCookie(c, 'session');
  const tagId = c.req.param('id');
  
  if (!sessionToken) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const { name } = await c.req.json();
    
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return c.json({ error: 'Tag name is required' }, 400);
    }

    const newName = name.trim();

    // Get current tag name
    const currentTag = await c.env.DB.prepare('SELECT name FROM tags WHERE id = ?').bind(tagId).first<Tag>();
    
    if (!currentTag) {
      return c.json({ error: 'Tag not found' }, 404);
    }

    const oldName = currentTag.name;

    // Auto-create parent tags for nested tags
    await ensureParentTags(c.env.DB, newName);

    // Update tag name
    await c.env.DB.prepare(`
      UPDATE tags SET name = ?, updated_at = datetime('now') WHERE id = ?
    `).bind(newName, tagId).run();

    // Update all notes that have this tag
    // For each note, replace the old tag with the new name in the JSON array
    const notesResult = await c.env.DB.prepare(`
      SELECT id, tags FROM notes WHERE tags LIKE ?
    `).bind(`%"${oldName}"%`).all();

    let updatedNotes = 0;
    for (const note of notesResult.results) {
      try {
        const tagsArr: string[] = JSON.parse(note.tags);
        const newTags = tagsArr.map(t => t === oldName ? newName : t);
        await c.env.DB.prepare(`
          UPDATE notes SET tags = ? WHERE id = ?
        `).bind(JSON.stringify(newTags), note.id).run();
        updatedNotes++;
      } catch (e) {
        console.error('Error updating note tags:', e);
      }
    }

    return c.json({ success: true, updated_notes: updatedNotes });
  } catch (error) {
    console.error('Error renaming tag:', error);
    return c.json({ error: 'Failed to rename tag' }, 500);
  }
});

// Reorder pinned tags
tags.patch('/reorder', async (c) => {
  const sessionToken = getCookie(c, 'session');
  
  if (!sessionToken) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const { tagIds } = await c.req.json();
    
    if (!Array.isArray(tagIds)) {
      return c.json({ error: 'tagIds array is required' }, 400);
    }

    // Update pin_order for each tag
    for (let i = 0; i < tagIds.length; i++) {
      await c.env.DB.prepare(`
        UPDATE tags SET pin_order = ?, updated_at = datetime('now') WHERE id = ?
      `).bind(i, tagIds[i]).run();
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Error reordering tags:', error);
    return c.json({ error: 'Failed to reorder tags' }, 500);
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
    // Get tag name first to remove from notes
    const tag = await c.env.DB.prepare('SELECT name FROM tags WHERE id = ?').bind(tagId).first<Tag>();
    
    if (!tag) {
      return c.json({ error: 'Tag not found' }, 404);
    }

    // Delete the tag from tags table
    await c.env.DB.prepare(`DELETE FROM tags WHERE id = ?`).bind(tagId).run();

    // Note: We don't automatically remove the tag from notes' tags arrays
    // The frontend should handle this or the user can clean up manually
    // This prevents accidental data loss

    return c.json({ success: true, removed_from_notes: false });
  } catch (error) {
    console.error('Error deleting tag:', error);
    return c.json({ error: 'Failed to delete tag' }, 500);
  }
});

// Remove a tag from all notes (cleanup endpoint)
tags.delete('/:id/cleanup', async (c) => {
  const sessionToken = getCookie(c, 'session');
  const tagId = c.req.param('id');
  
  if (!sessionToken) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const tag = await c.env.DB.prepare('SELECT name FROM tags WHERE id = ?').bind(tagId).first<Tag>();
    
    if (!tag) {
      return c.json({ error: 'Tag not found' }, 404);
    }

    // Remove tag from all notes' JSON arrays
    // This uses json_array_remove which requires SQLite 3.38+ (available in D1)
    const result = await c.env.DB.prepare(`
      UPDATE notes 
      SET tags = json_remove(tags, '$[' || (
        SELECT idx - 1 FROM (
          SELECT rowid - 1 as idx, value 
          FROM notes n2, json_each(n2.tags) 
          WHERE n2.id = notes.id AND value = ?
        )
      ) || ']')
      WHERE json_array_length(tags) > 0
    `).bind(tag.name).run();

    // Delete the tag
    await c.env.DB.prepare(`DELETE FROM tags WHERE id = ?`).bind(tagId).run();

    return c.json({ success: true, meta: result.meta });
  } catch (error) {
    console.error('Error cleaning up tag:', error);
    return c.json({ error: 'Failed to clean up tag' }, 500);
  }
});

export default tags;
