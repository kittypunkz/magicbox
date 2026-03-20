import { z } from 'zod';

// Pagination schema
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Note schemas
export const CreateNoteSchema = z.object({
  folder_id: z.number().int().positive().default(1),
  title: z.string().min(1).max(500).transform(s => s.trim()),
  content: z.string().max(100000).optional(),
});

export const UpdateNoteSchema = z.object({
  title: z.string().min(1).max(500).transform(s => s.trim()).optional(),
  content: z.string().max(100000).optional(),
  folder_id: z.number().int().positive().optional(),
  is_pinned: z.boolean().optional(),  // NEW
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided',
});

export const NoteQuerySchema = PaginationSchema.extend({
  folder_id: z.coerce.number().int().positive().optional(),
});

// Folder schemas
export const CreateFolderSchema = z.object({
  name: z.string().min(1).max(100).transform(s => s.trim()),
});

export const UpdateFolderSchema = z.object({
  name: z.string().min(1).max(100).transform(s => s.trim()),
});

// Search schema
export const SearchSchema = PaginationSchema.extend({
  q: z.string().min(1).max(200),
});
