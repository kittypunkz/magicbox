/**
 * Migration: folder_id → tags
 * 
 * This script migrates the notes from folder-based organization to tag-based.
 * Run this once on app startup after deploying migration 0007.
 * 
 * Features:
 * - Idempotent: Safe to run multiple times
 * - Transaction-wrapped: Rolls back on failure
 * - Preserves legacy_folder_id for rollback
 * 
 * Usage:
 *   import { runFolderToTagsMigration } from './migrations/folderToTags';
 *   await runFolderToTagsMigration(env.DB);
 */

export interface MigrationResult {
  success: boolean;
  notesMigrated: number;
  tagsCreated: number;
  error?: string;
}

/**
 * Run the folder_id → tags migration
 * @param db D1Database instance
 * @returns MigrationResult with details
 */
export async function runFolderToTagsMigration(db: D1Database): Promise<MigrationResult> {
  // Check if migration already completed
  const migrationStatus = await checkMigrationStatus(db);
  if (migrationStatus.alreadyRun) {
    return {
      success: true,
      notesMigrated: migrationStatus.notesWithTags,
      tagsCreated: migrationStatus.existingTags,
    };
  }

  try {
    // Run migration in a transaction
    const result = await db.batch([
      // Step 1: Ensure tags table exists (idempotent)
      db.prepare(`
        CREATE TABLE IF NOT EXISTS tags (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          color TEXT DEFAULT '#3b82f6',
          icon TEXT DEFAULT NULL,
          pinned INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `),

      // Step 2: Create tags from unique folder names
      db.prepare(`
        INSERT OR IGNORE INTO tags (name, pinned)
        SELECT DISTINCT name, 1 FROM folders
      `),

      // Step 3: Ensure legacy_folder_id column exists
      db.prepare(`
        ALTER TABLE notes ADD COLUMN IF NOT EXISTS legacy_folder_id INTEGER
      `),

      // Step 4: Backup folder_id to legacy_folder_id
      db.prepare(`
        UPDATE notes SET legacy_folder_id = folder_id 
        WHERE legacy_folder_id IS NULL
      `),

      // Step 5: Migrate notes - set tags JSON array from folder name
      db.prepare(`
        UPDATE notes 
        SET tags = json_array(
          (SELECT name FROM folders WHERE id = notes.folder_id)
        )
        WHERE tags = '[]' OR json_array_length(tags) = 0
      `),

      // Step 6: Create indexes (idempotent)
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name)`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_tags_pinned ON tags(pinned DESC, name ASC)`),

      // Step 7: Record migration as complete
      db.prepare(`
        INSERT OR IGNORE INTO _migrations (name, applied_at)
        VALUES ('0007_folder_to_tags', datetime('now'))
      `),
    ]);

    // Verify migration
    const verification = await db.prepare(`
      SELECT COUNT(*) as count FROM notes 
      WHERE tags != '[]' AND json_array_length(tags) > 0
    `).first<{ count: number }>();

    const tagCount = await db.prepare('SELECT COUNT(*) as count FROM tags').first<{ count: number }>();

    return {
      success: true,
      notesMigrated: verification?.count || 0,
      tagsCreated: tagCount?.count || 0,
    };
  } catch (error) {
    console.error('Migration failed:', error);
    return {
      success: false,
      notesMigrated: 0,
      tagsCreated: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if migration has already been run
 */
async function checkMigrationStatus(db: D1Database): Promise<{
  alreadyRun: boolean;
  notesWithTags: number;
  existingTags: number;
}> {
  try {
    // Check if _migrations table exists and has our migration
    const migrationRecord = await db.prepare(`
      SELECT 1 FROM _migrations WHERE name = '0007_folder_to_tags'
    `).first();

    if (migrationRecord) {
      const tagCount = await db.prepare('SELECT COUNT(*) as count FROM tags').first<{ count: number }>();
      const notesWithTags = await db.prepare(`
        SELECT COUNT(*) as count FROM notes 
        WHERE tags != '[]' AND json_array_length(tags) > 0
      `).first<{ count: number }>();

      return {
        alreadyRun: true,
        notesWithTags: notesWithTags?.count || 0,
        existingTags: tagCount?.count || 0,
      };
    }

    return { alreadyRun: false, notesWithTags: 0, existingTags: 0 };
  } catch {
    // _migrations table doesn't exist yet
    return { alreadyRun: false, notesWithTags: 0, existingTags: 0 };
  }
}

/**
 * Rollback: Restore folder_id from legacy_folder_id
 * WARNING: Only use if migration caused issues
 */
export async function rollbackFolderToTagsMigration(db: D1Database): Promise<MigrationResult> {
  try {
    await db.batch([
      // Restore folder_id from legacy
      db.prepare(`
        UPDATE notes 
        SET folder_id = legacy_folder_id 
        WHERE legacy_folder_id IS NOT NULL
      `),

      // Remove migration record
      db.prepare(`
        DELETE FROM _migrations WHERE name = '0007_folder_to_tags'
      `),
    ]);

    return {
      success: true,
      notesMigrated: 0,
      tagsCreated: 0,
    };
  } catch (error) {
    return {
      success: false,
      notesMigrated: 0,
      tagsCreated: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create _migrations table if it doesn't exist
 * Call this before running migrations
 */
export async function ensureMigrationsTable(db: D1Database): Promise<void> {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
}

/**
 * Run migration with full setup
 * Use this for app startup
 */
export async function runMigrationWithSetup(db: D1Database): Promise<MigrationResult> {
  await ensureMigrationsTable(db);
  return runFolderToTagsMigration(db);
}
