import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { getDb } from "./db";
import { absPath, noteMediaDir } from "./paths";
import { nowIso } from "./markdown";
import {
  ALLOWED,
  DOC_ALLOWED,
  MAX_BYTES,
  MAX_DOC_BYTES,
  MAX_VIDEO_BYTES,
  VIDEO_ALLOWED,
  isDocMime,
  isVideoMime,
  sniffMime,
} from "./media-kind";

export {
  ALLOWED,
  DOC_ALLOWED,
  MAX_BYTES,
  MAX_DOC_BYTES,
  MAX_VIDEO_BYTES,
  VIDEO_ALLOWED,
  isDocMime,
  isVideoMime,
  sniffMime,
};

export type FileRole = "cover" | "result" | "reference" | "inline" | "attachment";

export function attachFile(opts: {
  noteId: number;
  buffer: Buffer;
  mime: string;
  origName: string;
  role: FileRole;
}) {
  const mime = sniffMime(opts.buffer, opts.mime);
  const ext = ALLOWED[mime] || VIDEO_ALLOWED[mime] || DOC_ALLOWED[mime];
  if (!ext) {
    const name = opts.origName || "";
    if (/\.mkv$/i.test(name) || opts.mime === "video/x-matroska") {
      throw new Error("MKV браузер не проигрывает. Нужен mp4, webm или mov");
    }
    throw new Error("Можно jpeg, png, webp, gif, видео mp4, webm, mov или PDF");
  }
  const video = isVideoMime(mime);
  const doc = isDocMime(mime);
  if ((video || doc) && opts.role === "cover") {
    throw new Error(video ? "Видео нельзя сделать обложкой" : "PDF нельзя сделать обложкой");
  }
  if (video && opts.buffer.length > MAX_VIDEO_BYTES) throw new Error("Видео больше 500 МБ");
  if (doc && opts.buffer.length > MAX_DOC_BYTES) throw new Error("PDF больше 50 МБ");
  if (!video && !doc && opts.buffer.length > MAX_BYTES) throw new Error("Файл больше 15 МБ");

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
    .run(
      opts.origName || `${doc ? "file" : video ? "video" : "image"}.${ext}`,
      mime,
      ext,
      opts.buffer.length,
      hash,
      ts
    );
  const fileId = Number(info.lastInsertRowid);

  const dir = noteMediaDir(opts.noteId);
  fs.mkdirSync(dir, { recursive: true });
  const rel = path.posix.join("data", "media", String(opts.noteId), `${fileId}.${ext}`);
  const abs = absPath(rel);
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

  if (!video && !doc && !note.cover_file_id && opts.role !== "cover") {
    db.prepare("UPDATE notes SET cover_file_id = ? WHERE id = ? AND cover_file_id IS NULL").run(
      fileId,
      opts.noteId
    );
  }

  return { id: fileId, url: `/media/${fileId}` };
}

export function setFileRole(noteId: number, fileId: number, role: FileRole) {
  const db = getDb();
  const link = db
    .prepare("SELECT id, role FROM note_files WHERE note_id = ? AND file_id = ?")
    .get(noteId, fileId) as { id: number; role: string } | undefined;
  if (!link) throw new Error("Файл не привязан к заметке");
  if (link.role === role) return { id: fileId, role };

  if (role === "cover") {
    const row = getFileRow(fileId);
    if (row && isVideoMime(row.mime)) throw new Error("Видео нельзя сделать обложкой");
    if (row && isDocMime(row.mime)) throw new Error("PDF нельзя сделать обложкой");
    setCover(noteId, fileId);
    return { id: fileId, role };
  }

  const sort =
    (
      db
        .prepare("SELECT COALESCE(MAX(sort), -1) + 1 AS s FROM note_files WHERE note_id = ? AND role = ?")
        .get(noteId, role) as { s: number }
    ).s ?? 0;
  db.prepare("UPDATE note_files SET role = ?, sort = ? WHERE note_id = ? AND file_id = ?").run(
    role,
    sort,
    noteId,
    fileId
  );

  const note = db.prepare("SELECT cover_file_id FROM notes WHERE id = ?").get(noteId) as
    | { cover_file_id: number | null }
    | undefined;
  if (note && Number(note.cover_file_id) === fileId) {
    const next = nextImageFileId(noteId, fileId);
    db.prepare("UPDATE notes SET cover_file_id = ? WHERE id = ?").run(next, noteId);
  }

  return { id: fileId, role };
}

function nextImageFileId(noteId: number, exceptFileId?: number) {
  const db = getDb();
  const row = (
    exceptFileId == null
      ? db
          .prepare(
            `SELECT nf.file_id AS file_id
             FROM note_files nf
             JOIN files f ON f.id = nf.file_id
             WHERE nf.note_id = ? AND f.mime LIKE 'image/%'
             ORDER BY CASE nf.role WHEN 'cover' THEN 0 ELSE 1 END, nf.sort, nf.id
             LIMIT 1`
          )
          .get(noteId)
      : db
          .prepare(
            `SELECT nf.file_id AS file_id
             FROM note_files nf
             JOIN files f ON f.id = nf.file_id
             WHERE nf.note_id = ? AND nf.file_id != ? AND f.mime LIKE 'image/%'
             ORDER BY CASE nf.role WHEN 'cover' THEN 0 ELSE 1 END, nf.sort, nf.id
             LIMIT 1`
          )
          .get(noteId, exceptFileId)
  ) as { file_id: number } | undefined;
  return row ? row.file_id : null;
}

export function setCover(noteId: number, fileId: number) {
  const db = getDb();
  const link = db
    .prepare("SELECT id FROM note_files WHERE note_id = ? AND file_id = ?")
    .get(noteId, fileId);
  if (!link) throw new Error("Файл не привязан к заметке");
  const row = getFileRow(fileId);
  if (row && isVideoMime(row.mime)) throw new Error("Видео нельзя сделать обложкой");
  if (row && isDocMime(row.mime)) throw new Error("PDF нельзя сделать обложкой");
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
  return absPath(rel);
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
    db.prepare("UPDATE notes SET cover_file_id = ? WHERE id = ?").run(nextImageFileId(noteId), noteId);
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
