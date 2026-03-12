import { Hono } from 'hono';
import type { Env, SearchResult } from '../types';

const search = new Hono<{ Bindings: Env }>();

// Search notes and folders
search.get('/', async (c) => {
  const q = c.req.query('q')?.trim();
  
  if (!q) {
    return c.json({ notes: [], folders: [] });
  }
  
  // Search notes using FTS
  const { results: notes } = await c.env.DB.prepare(`
    SELECT n.*, f.name as folder_name 
    FROM notes_fts fts
    JOIN notes n ON fts.rowid = n.id
    JOIN folders f ON n.folder_id = f.id
    WHERE notes_fts MATCH ?
    ORDER BY rank
    LIMIT 20
  `).bind(q).all();
  
  // Search folders (partial match)
  const { results: folders } = await c.env.DB.prepare(`
    SELECT * FROM folders 
    WHERE name LIKE ?
    ORDER BY name
    LIMIT 10
  `).bind(`%${q}%`).all();
  
  const result: SearchResult = {
    notes: notes || [],
    folders: folders || []
  };
  
  return c.json(result);
});

export default search;
