import { z } from 'zod';

// Pagination schema
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Only allow http/https URLs for bookmarks
const httpUrlSchema = z.string().url().max(2048).refine(url => {
  try {
    return ['http:', 'https:'].includes(new URL(url).protocol);
  } catch {
    return false;
  }
}, { message: 'URL must use http or https protocol' });

// Tag schemas
const tagSchema = z.string().trim().min(1).max(50).regex(/^[\w.-]+$/, 'Tag can only contain letters, numbers, dots, underscores, and hyphens');

// Note schemas
export const CreateNoteSchema = z.object({
  folder_id: z.number().int().positive().default(1),
  title: z.string().trim().min(1).max(500),
  content: z.string().max(100000).optional(),
  bookmark_url: httpUrlSchema.optional(),
  tags: z.array(tagSchema).max(20).optional(),
});

export const UpdateNoteSchema = z.object({
  title: z.string().trim().min(1).max(500).optional(),
  content: z.string().max(100000).optional(),
  folder_id: z.number().int().positive().optional(),
  is_pinned: z.boolean().optional(),
  bookmark_url: httpUrlSchema.nullish(),
  tags: z.array(tagSchema).max(20).optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided',
});

export const NoteQuerySchema = PaginationSchema.extend({
  folder_id: z.coerce.number().int().positive().optional(),
  tag: z.string().trim().optional(),  // Filter by tag name (backward compat: maps to ?tag=folderName)
});

// Folder schemas
export const CreateFolderSchema = z.object({
  name: z.string().trim().min(1).max(100),
});

export const UpdateFolderSchema = z.object({
  name: z.string().trim().min(1).max(100),
});

// Search schema
export const SearchSchema = PaginationSchema.extend({
  q: z.string().trim().min(1).max(200),
});
