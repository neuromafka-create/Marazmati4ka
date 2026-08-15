import path from "node:path";

export const ROOT = process.env.MARAZ_ROOT || process.cwd();
export const DOCS_DIR = process.env.MARAZ_DOCS_DIR || path.join(ROOT, "docs");
export const DATA_DIR = process.env.MARAZ_DATA_DIR || path.join(ROOT, "data");
export const MEDIA_DIR = path.join(DATA_DIR, "media");
export const DB_PATH = path.join(DATA_DIR, "notebook.db");
export const TRASH_DIR = process.env.MARAZ_TRASH_DIR || path.join(ROOT, "_trash");

export function absPath(rel: string) {
  if (!rel) return ROOT;
  if (path.isAbsolute(rel)) return rel;
  return path.join(ROOT, rel.split("/").join(path.sep));
}

export function noteMediaDir(noteId: number) {
  return path.join(MEDIA_DIR, String(noteId));
}
