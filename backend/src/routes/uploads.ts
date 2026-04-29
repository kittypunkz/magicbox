import { Hono } from 'hono';
import { sessionAuthMiddleware } from '../middleware/auth';
import type { Env, UserContext } from '../types';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const MAX_BYTES = 5 * 1024 * 1024;

const EXT_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

const uploads = new Hono<{ Bindings: Env; Variables: { user: UserContext } }>();

async function sha256Hex(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

uploads.post('/', sessionAuthMiddleware, async (c) => {
  const noteId = parseInt(c.req.query('note_id') || '');
  if (isNaN(noteId)) return c.json({ success: false, error: 'note_id required' }, 400);

  const note = await c.env.DB.prepare('SELECT id FROM notes WHERE id = ?').bind(noteId).first();
  if (!note) return c.json({ success: false, error: 'Note not found' }, 404);

  const formData = await c.req.formData();
  const file = formData.get('file');

  if (!(file instanceof File))
    return c.json({ success: false, error: 'No file provided' }, 400);
  if (!ALLOWED_TYPES.has(file.type))
    return c.json({ success: false, error: 'Only jpeg, png, gif, webp allowed' }, 415);
  if (file.size > MAX_BYTES)
    return c.json({ success: false, error: 'File exceeds 5 MB' }, 413);

  const arrayBuffer = await file.arrayBuffer();
  const hash = await sha256Hex(arrayBuffer);
  const ext = EXT_MAP[file.type] || 'bin';
  const key = `${hash}.${ext}`;

  // Dedup: HEAD is a cheap Class B op
  const existing = await c.env.IMAGES.head(key);
  if (!existing) {
    await c.env.IMAGES.put(key, arrayBuffer, {
      httpMetadata: { contentType: file.type },
    });
  }

  // Track association — UNIQUE on r2_key makes this idempotent
  await c.env.DB.prepare(
    'INSERT OR IGNORE INTO note_images (note_id, r2_key) VALUES (?, ?)'
  ).bind(noteId, key).run();

  const url = `${new URL(c.req.url).origin}/uploads/${key}`;
  return c.json({ success: true, data: { url, key } }, 201);
});

// No auth — BlockNote renders <img src="..."> without credentials
uploads.get('/:key', async (c) => {
  const key = c.req.param('key');
  if (key.includes('/') || key.includes('..'))
    return c.json({ success: false, error: 'Invalid key' }, 400);

  const object = await c.env.IMAGES.get(key);
  if (!object) return c.json({ success: false, error: 'Not found' }, 404);

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  return new Response(object.body, { headers });
});

export default uploads;
