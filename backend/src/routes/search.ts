import { Hono } from 'hono';
import { sessionAuthMiddleware as authMiddleware } from '../middleware/auth';
import { SearchSchema } from '../validators';
import type { Env, PaginatedResponse, NoteWithFolder, Folder, UserContext } from '../types';

const search = new Hono<{ Bindings: Env; Variables: { user: UserContext } }>();

// Apply auth to all search routes
search.use('/*', authMiddleware);

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
  
  // Sanitize for trigram FTS: strip special chars, keep letters and numbers
  const sanitizedQ = q.replace(/[^\p{L}\p{N}]/gu, ' ').trim();
  if (!sanitizedQ) {
    return c.json({
      data: [],
      pagination: { page, limit, total: 0, totalPages: 0 },
      folders: [],
    });
  }

  // Search notes using FTS with pagination
  let notes: NoteWithFolder[] | null = null;
  let totalCount = 0;

  const ftsResult = await db.prepare(`
    SELECT n.*, f.name as folder_name
    FROM notes_fts fts
    JOIN notes n ON fts.rowid = n.id
    JOIN folders f ON n.folder_id = f.id
    WHERE notes_fts MATCH ?1
    ORDER BY rank
    LIMIT ?2 OFFSET ?3
  `).bind(sanitizedQ, limit, offset).all<NoteWithFolder>();

  notes = ftsResult.results;

  // Get total count for pagination
  const countResult = await db.prepare(`
    SELECT COUNT(*) as total
    FROM notes_fts fts
    WHERE notes_fts MATCH ?1
  `).bind(sanitizedQ).first<{ total: number }>();

  totalCount = countResult?.total || 0;

  // If FTS returns nothing, try LIKE as fallback for edge cases
  if ((!notes || notes.length === 0) && sanitizedQ.length >= 2) {
    const likePattern = `%${sanitizedQ.replace(/[\\%_]/g, '\\$&')}%`;
    const { results: likeNotes } = await db.prepare(`
      SELECT n.*, f.name as folder_name
      FROM notes n
      JOIN folders f ON n.folder_id = f.id
      WHERE n.title LIKE ?1 ESCAPE '\\' OR n.content LIKE ?1 ESCAPE '\\'
      ORDER BY n.updated_at DESC
      LIMIT ?2 OFFSET ?3
    `).bind(likePattern, limit, offset).all<NoteWithFolder>();

    if (likeNotes && likeNotes.length > 0) {
      notes = likeNotes;
      const likeCount = await db.prepare(`
        SELECT COUNT(*) as total
        FROM notes n
        WHERE n.title LIKE ?1 ESCAPE '\\' OR n.content LIKE ?1 ESCAPE '\\'
      `).bind(likePattern).first<{ total: number }>();
      totalCount = likeCount?.total || 0;
    }
  }
  
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
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
    folders: folders || [],
  };
  
  return c.json(response);
});

export default search;
