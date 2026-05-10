CREATE TABLE IF NOT EXISTS ai_source_feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_type TEXT NOT NULL CHECK (source_type IN ('note', 'task', 'bookmark')),
  source_id INTEGER NOT NULL,
  note_id INTEGER,
  scope TEXT,
  message TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ai_source_feedback_created_at ON ai_source_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_source_feedback_source ON ai_source_feedback(source_type, source_id);
