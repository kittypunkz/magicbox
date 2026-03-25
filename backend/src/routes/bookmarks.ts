import { Hono } from 'hono';
import type { Env } from '../types';

const bookmarks = new Hono<{ Bindings: Env }>();

/**
 * Fetch website metadata (title + favicon) from a URL.
 * GET /api/bookmarks/metadata?url=https://example.com
 */
bookmarks.get('/metadata', async (c) => {
  const url = c.req.query('url');

  if (!url) {
    return c.json({ success: false, error: 'Missing url parameter' }, 400);
  }

  // Validate URL
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return c.json({ success: false, error: 'Only http/https URLs allowed' }, 400);
    }
  } catch {
    return c.json({ success: false, error: 'Invalid URL' }, 400);
  }

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'MagicBox/1.0 (Bookmark Fetcher)' },
      redirect: 'follow',
      // @ts-expect-error - Cloudflare Workers specific
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return c.json({
        success: true,
        data: { title: null, hostname: new URL(url).hostname }
      });
    }

    const html = await response.text();

    // Extract <title>
    let title: string | null = null;
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    if (titleMatch?.[1]) {
      title = titleMatch[1]
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim() || null;
    }

    // Extract <meta property="og:title"> as fallback
    if (!title) {
      const ogMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i)
        || html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:title["']/i);
      if (ogMatch?.[1]) {
        title = ogMatch[1].trim() || null;
      }
    }

    return c.json({
      success: true,
      data: {
        title,
        hostname: new URL(url).hostname,
      }
    });
  } catch {
    return c.json({
      success: true,
      data: { title: null, hostname: new URL(url).hostname }
    });
  }
});

export default bookmarks;
