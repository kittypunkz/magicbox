-- Migrate tasks to kanban statuses: backlog, doing, done (replaces pending/done)

ALTER TABLE tasks RENAME TO tasks_old;

CREATE TABLE tasks (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  note_id      INTEGER REFERENCES notes(id) ON DELETE SET NULL,
  title        TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'backlog' CHECK (status IN ('backlog', 'doing', 'done')),
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT
);

INSERT INTO tasks (id, note_id, title, status, created_at, completed_at)
SELECT
  id,
  note_id,
  title,
  CASE WHEN status = 'pending' THEN 'backlog' ELSE status END,
  created_at,
  completed_at
FROM tasks_old;

DROP TABLE tasks_old;

CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_note_id ON tasks(note_id);
