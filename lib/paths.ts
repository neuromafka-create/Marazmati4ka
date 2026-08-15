import path from "node:path";

export const ROOT = process.cwd();
export const DOCS_DIR = path.join(ROOT, "docs");
export const DATA_DIR = path.join(ROOT, "data");
export const MEDIA_DIR = path.join(DATA_DIR, "media");
export const DB_PATH = path.join(DATA_DIR, "notebook.db");
export const TRASH_DIR = path.join(ROOT, "_trash");

export function noteMediaDir(noteId: number) {
  return path.join(MEDIA_DIR, String(noteId));
}
