import { Hono } from 'hono';
import { SearchSchema } from '../validators';
import type { Env, PaginatedResponse, NoteWithFolder, Folder } from '../types';

const search = new Hono<{ Bindings: Env }>();

// Search notes and folders
search.get('/', async (c) => {
  const queryData = {
    q: c.req.query('q'),
    page: c.req.query('page'),
    limit: c.req.query('limit'),
  };
  
  const parsed = SearchSchema.safeParse(queryData);
  if (!parsed.success) {
    return c.json({ success: false, error: 'Validation error', details: parsed.error.errors }, 400);
  }
  
  const { q, page, limit } = parsed.data;
  const db = c.env.DB;
  const offset = (page - 1) * limit;
  
  // Sanitize FTS5 query: escape double quotes and wrap in quotes
  const sanitizedQ = `"${q.replace(/"/g, '""')}"`;
  
  // Search notes using FTS with pagination
  const { results: notes } = await db.prepare(`
    SELECT n.*, f.name as folder_name 
    FROM notes_fts fts
    JOIN notes n ON fts.rowid = n.id
    JOIN folders f ON n.folder_id = f.id
    WHERE notes_fts MATCH ?1
    ORDER BY rank
    LIMIT ?2 OFFSET ?3
  `).bind(sanitizedQ, limit, offset).all<NoteWithFolder>();
  
  // Get total count for pagination
  const countResult = await db.prepare(`
    SELECT COUNT(*) as total 
    FROM notes_fts fts
    WHERE notes_fts MATCH ?1
  `).bind(sanitizedQ).first<{ total: number }>();
  
  // Escape LIKE special characters (%, _, \)
  const escapedQ = q.replace(/[\\%_]/g, '\\$&');
  
  // Search folders (partial match)
  const { results: folders } = await db.prepare(`
    SELECT * FROM folders 
    WHERE name LIKE ?1 ESCAPE '\\'
    ORDER BY name
    LIMIT 10
  `).bind(`%${escapedQ}%`).all<Folder>();
  
  const response: PaginatedResponse<NoteWithFolder> & { folders: Folder[] } = {
    data: notes || [],
    pagination: {
      page,
      limit,
      total: countResult?.total || 0,
      totalPages: Math.ceil((countResult?.total || 0) / limit),
    },
    folders: folders || [],
  };
  
  return c.json(response);
});

export default search;
