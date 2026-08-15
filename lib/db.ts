import fs from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { DATA_DIR, DB_PATH } from "./paths";

let db: DatabaseSync | null = null;

function migrate(database: DatabaseSync) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL DEFAULT '',
      type TEXT NOT NULL,
      domain TEXT NOT NULL,
      slug TEXT NOT NULL,
      body TEXT NOT NULL DEFAULT '',
      source TEXT,
      snippet TEXT NOT NULL DEFAULT '',
      prompt_extract TEXT,
      path TEXT,
      file_hash TEXT,
      file_mtime TEXT,
      cover_file_id INTEGER,
      active INTEGER NOT NULL DEFAULT 1,
      draft INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      orig_name TEXT NOT NULL,
      mime TEXT NOT NULL,
      ext TEXT NOT NULL,
      bytes INTEGER NOT NULL,
      width INTEGER,
      height INTEGER,
      path TEXT NOT NULL,
      preview_path TEXT,
      hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS note_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      note_id INTEGER NOT NULL,
      file_id INTEGER NOT NULL,
      role TEXT NOT NULL,
      sort INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (note_id) REFERENCES notes(id),
      FOREIGN KEY (file_id) REFERENCES files(id)
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
      title, body, content='notes', content_rowid='id', tokenize='unicode61'
    );

    CREATE INDEX IF NOT EXISTS idx_notes_active ON notes(active, draft);
    CREATE TABLE IF NOT EXISTS note_domains (
      note_id INTEGER NOT NULL,
      domain_slug TEXT NOT NULL,
      sort INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (note_id, domain_slug)
    );

    CREATE INDEX IF NOT EXISTS idx_notes_type ON notes(type, domain);
    CREATE INDEX IF NOT EXISTS idx_note_domains_slug ON note_domains(domain_slug);
    CREATE INDEX IF NOT EXISTS idx_notes_path ON notes(path);
    CREATE TABLE IF NOT EXISTS taxons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kind TEXT NOT NULL,
      slug TEXT NOT NULL,
      label TEXT NOT NULL,
      sort INTEGER NOT NULL DEFAULT 0,
      UNIQUE (kind, slug)
    );

    CREATE INDEX IF NOT EXISTS idx_note_files_note ON note_files(note_id, role);

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TRIGGER IF NOT EXISTS notes_ai AFTER INSERT ON notes BEGIN
      INSERT INTO notes_fts(rowid, title, body) VALUES (new.id, new.title, new.body);
    END;
    CREATE TRIGGER IF NOT EXISTS notes_ad AFTER DELETE ON notes BEGIN
      INSERT INTO notes_fts(notes_fts, rowid, title, body) VALUES('delete', old.id, old.title, old.body);
    END;
    CREATE TRIGGER IF NOT EXISTS notes_au AFTER UPDATE ON notes BEGIN
      INSERT INTO notes_fts(notes_fts, rowid, title, body) VALUES('delete', old.id, old.title, old.body);
      INSERT INTO notes_fts(rowid, title, body) VALUES (new.id, new.title, new.body);
    END;
  `);
}

export function getDb() {
  if (db) return db;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  db = new DatabaseSync(DB_PATH);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  migrate(db);
  db.exec(`
    INSERT OR IGNORE INTO note_domains (note_id, domain_slug, sort)
    SELECT id, domain, 0 FROM notes WHERE domain IS NOT NULL AND TRIM(domain) != ''
  `);
  return db;
}
