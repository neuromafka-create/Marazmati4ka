import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { getDb } from "./db";
import { noteMediaDir } from "./paths";
import { nowIso } from "./markdown";

export const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export function sniffMime(buf: Buffer, fallback = ""): string {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (buf.length >= 6 && buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return "image/gif";
  if (
    buf.length >= 12 &&
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  if (fallback.startsWith("image/")) return fallback;
  return "";
}

export const MAX_BYTES = 15 * 1024 * 1024;

export type FileRole = "cover" | "result" | "reference" | "inline" | "attachment";

export function attachFile(opts: {
  noteId: number;
  buffer: Buffer;
  mime: string;
  origName: string;
  role: FileRole;
}) {
  const mime = sniffMime(opts.buffer, opts.mime);
  const ext = ALLOWED[mime];
  if (!ext) throw new Error("Можно jpeg, png, webp или gif");
  if (opts.buffer.length > MAX_BYTES) throw new Error("Файл больше 15 МБ");

  const db = getDb();
  const note = db.prepare("SELECT id, cover_file_id FROM notes WHERE id = ?").get(opts.noteId) as
    | { id: number; cover_file_id: number | null }
    | undefined;
  if (!note) throw new Error("Заметка не найдена");

  const hash = crypto.createHash("sha256").update(opts.buffer).digest("hex");
  const ts = nowIso();
  const info = db
    .prepare(
      `INSERT INTO files (orig_name, mime, ext, bytes, path, preview_path, hash, created_at)
       VALUES (?, ?, ?, ?, '', NULL, ?, ?)`
    )
    .run(opts.origName || `image.${ext}`, mime, ext, opts.buffer.length, hash, ts);
  const fileId = Number(info.lastInsertRowid);

  const dir = noteMediaDir(opts.noteId);
  fs.mkdirSync(dir, { recursive: true });
  const rel = path.posix.join("data", "media", String(opts.noteId), `${fileId}.${ext}`);
  const abs = path.join(process.cwd(), rel);
  fs.writeFileSync(abs, opts.buffer);
  db.prepare("UPDATE files SET path = ?, preview_path = ? WHERE id = ?").run(rel, rel, fileId);

  const sort =
    (
      db
        .prepare("SELECT COALESCE(MAX(sort), -1) + 1 AS s FROM note_files WHERE note_id = ? AND role = ?")
        .get(opts.noteId, opts.role) as { s: number }
    ).s ?? 0;

  if (opts.role === "cover") {
    db.prepare("UPDATE note_files SET role = 'result' WHERE note_id = ? AND role = 'cover'").run(opts.noteId);
    db.prepare("UPDATE notes SET cover_file_id = ? WHERE id = ?").run(fileId, opts.noteId);
  }

  db.prepare("INSERT INTO note_files (note_id, file_id, role, sort) VALUES (?, ?, ?, ?)").run(
    opts.noteId,
    fileId,
    opts.role,
    sort
  );

  if (!note.cover_file_id && opts.role !== "cover") {
    db.prepare("UPDATE notes SET cover_file_id = ? WHERE id = ? AND cover_file_id IS NULL").run(
      fileId,
      opts.noteId
    );
  }

  return { id: fileId, url: `/media/${fileId}` };
}

export function setCover(noteId: number, fileId: number) {
  const db = getDb();
  const link = db
    .prepare("SELECT id FROM note_files WHERE note_id = ? AND file_id = ?")
    .get(noteId, fileId);
  if (!link) throw new Error("Файл не привязан к заметке");
  db.prepare("UPDATE note_files SET role = 'result' WHERE note_id = ? AND role = 'cover'").run(noteId);
  db.prepare("UPDATE note_files SET role = 'cover', sort = 0 WHERE note_id = ? AND file_id = ?").run(noteId, fileId);
  db.prepare("UPDATE notes SET cover_file_id = ? WHERE id = ?").run(fileId, noteId);
}

export function getFileRow(id: number) {
  const row = getDb().prepare("SELECT * FROM files WHERE id = ?").get(id) as
    | {
        id: number;
        path: string;
        mime: string;
        orig_name: string;
      }
    | undefined;
  if (!row) return undefined;
  return { id: Number(row.id), path: String(row.path), mime: String(row.mime), orig_name: String(row.orig_name) };
}

export function absoluteFilePath(rel: string) {
  return path.join(process.cwd(), rel.split("/").join(path.sep));
}

export function detachFile(noteId: number, fileId: number) {
  const db = getDb();
  const link = db
    .prepare("SELECT id FROM note_files WHERE note_id = ? AND file_id = ?")
    .get(noteId, fileId);
  if (!link) throw new Error("Файл не привязан к заметке");

  db.prepare("DELETE FROM note_files WHERE note_id = ? AND file_id = ?").run(noteId, fileId);

  const note = db.prepare("SELECT cover_file_id FROM notes WHERE id = ?").get(noteId) as
    | { cover_file_id: number | null }
    | undefined;
  if (note && Number(note.cover_file_id) === fileId) {
    const next = db
      .prepare("SELECT file_id FROM note_files WHERE note_id = ? ORDER BY sort, id LIMIT 1")
      .get(noteId) as { file_id: number } | undefined;
    db.prepare("UPDATE notes SET cover_file_id = ? WHERE id = ?").run(next ? next.file_id : null, noteId);
  }

  const stillUsed = db.prepare("SELECT 1 AS x FROM note_files WHERE file_id = ?").get(fileId);
  if (!stillUsed) {
    const row = getFileRow(fileId);
    db.prepare("DELETE FROM files WHERE id = ?").run(fileId);
    if (row?.path) {
      const abs = absoluteFilePath(row.path);
      if (fs.existsSync(abs)) {
        try {
          fs.unlinkSync(abs);
        } catch {
          /* файл на диске не блокирует */
        }
      }
    }
  }
}
