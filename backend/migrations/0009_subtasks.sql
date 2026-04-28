ALTER TABLE tasks ADD COLUMN description TEXT;

CREATE TABLE subtasks (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id    INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  done       INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_subtasks_task_id ON subtasks(task_id);
