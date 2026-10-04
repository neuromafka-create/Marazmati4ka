import fs from "node:fs";
import path from "node:path";
import { getDb } from "./db";
import { extractPrompt, hashText, nowIso, slugify, snippetOf } from "./markdown";
import { defaultDomainSlug, defaultTypeSlug, isDomain, isType } from "./taxonomy";
import { absPath, DOCS_DIR, TRASH_DIR } from "./paths";
import { FALLBACK_COVER } from "./placeholder-cover";

export type Note = {
  id: number;
  title: string;
  type: string;
  domain: string;
  domains: string[];
  slug: string;
  body: string;
  source: string | null;
  snippet: string;
  prompt_extract: string | null;
  path: string | null;
  file_hash: string | null;
  cover_file_id: number | null;
  active: number;
  draft: number;
  created_at: string;
  updated_at: string;
  cover_url?: string | null;
};

export type NoteFile = {
  id: number;
  file_id: number;
  role: string;
  sort: number;
  orig_name: string;
  mime: string;
  url: string;
};

export type NoteSort = "title" | "created" | "updated";
export type NoteDir = "asc" | "desc";

export { FALLBACK_COVER };

export function coverSrc(url?: string | null, fallback = FALLBACK_COVER) {
  return url || fallback;
}

export function parseSort(raw?: string | null): NoteSort {
  return raw === "title" || raw === "created" || raw === "updated" ? raw : "updated";
}

export function parseDir(raw?: string | null): NoteDir {
  return raw === "asc" || raw === "desc" ? raw : "desc";
}

export function listNotes(opts: {
  q?: string;
  types?: string[];
  domains?: string[];
  sort?: NoteSort;
  dir?: NoteDir;
}) {
  const db = getDb();
  const types = (opts.types || []).filter(isType);
  const domains = (opts.domains || []).filter(isDomain);
  const q = opts.q?.trim();

  const where = ["n.active = 1", "n.draft = 0"];
  const params: (string | number)[] = [];

  if (types.length) {
    where.push(`n.type IN (${types.map(() => "?").join(",")})`);
    params.push(...types);
  }
  if (domains.length) {
    where.push(
      `EXISTS (SELECT 1 FROM note_domains nd WHERE nd.note_id = n.id AND nd.domain_slug IN (${domains.map(() => "?").join(",")}))`
    );
    params.push(...domains);
  }

  let sql = `
    SELECT n.id, n.title, n.type, n.domain, n.slug, n.snippet, n.source,
           n.cover_file_id, n.created_at, n.updated_at,
      CASE WHEN n.cover_file_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM files cf WHERE cf.id = n.cover_file_id AND cf.mime LIKE 'image/%'
      ) THEN '/media/' || n.cover_file_id ELSE NULL END AS cover_url
    FROM notes n
  `;

  if (q) {
    sql += ` JOIN notes_fts fts ON fts.rowid = n.id`;
    where.push("notes_fts MATCH ?");
    params.push(escapeFts(q));
  }

  const sort = opts.sort || "updated";
  const dir = opts.dir || "desc";
  const orderSql =
    sort === "title"
      ? `n.title COLLATE NOCASE ${dir === "asc" ? "ASC" : "DESC"}`
      : sort === "created"
        ? `n.created_at ${dir === "asc" ? "ASC" : "DESC"}`
        : `n.updated_at ${dir === "asc" ? "ASC" : "DESC"}`;
  sql += ` WHERE ${where.join(" AND ")} ORDER BY ${orderSql}`;
  const rows = (db.prepare(sql).all(...params) as unknown as Note[]).map(plain);
  const withDomains = attachDomains(rows);
  if (sort !== "title") return withDomains;
  const mul = dir === "asc" ? 1 : -1;
  return [...withDomains].sort(
    (a, b) => mul * (a.title || "").localeCompare(b.title || "", "ru", { sensitivity: "base" })
  );
}

export function getNoteDomains(noteId: number) {
  const rows = getDb()
    .prepare("SELECT domain_slug FROM note_domains WHERE note_id = ? ORDER BY sort, domain_slug")
    .all(noteId) as { domain_slug: string }[];
  return rows.map((r) => String(r.domain_slug));
}

export function setNoteDomains(noteId: number, slugs: string[]) {
  const unique = [...new Set(slugs.filter(isDomain))];
  if (!unique.length) throw new Error("Нужна хотя бы одна область");
  const db = getDb();
  db.prepare("DELETE FROM note_domains WHERE note_id = ?").run(noteId);
  const ins = db.prepare("INSERT INTO note_domains (note_id, domain_slug, sort) VALUES (?, ?, ?)");
  unique.forEach((slug, i) => ins.run(noteId, slug, i));
  db.prepare("UPDATE notes SET domain = ? WHERE id = ?").run(unique[0], noteId);
  return unique;
}

function attachDomains(notes: Note[]) {
  if (!notes.length) return notes;
  const db = getDb();
  const ids = notes.map((n) => n.id);
  const rows = db
    .prepare(
      `SELECT note_id, domain_slug FROM note_domains WHERE note_id IN (${ids.map(() => "?").join(",")}) ORDER BY sort, domain_slug`
    )
    .all(...ids) as { note_id: number; domain_slug: string }[];
  const map = new Map<number, string[]>();
  for (const row of rows) {
    const list = map.get(row.note_id) || [];
    list.push(String(row.domain_slug));
    map.set(row.note_id, list);
  }
  return notes.map((n) => ({
    ...n,
    domains: map.get(n.id) || (n.domain ? [n.domain] : []),
  }));
}

function plain<T>(row: T): T {
  return row ? (JSON.parse(JSON.stringify(row)) as T) : row;
}

function escapeFts(q: string) {
  const cleaned = q.replace(/["']/g, " ").trim();
  if (!cleaned) return '""';
  return cleaned
    .split(/\s+/)
    .map((w) => `"${w}"*`)
    .join(" AND ");
}

export function getNote(id: number) {
  const db = getDb();
  const note = db
    .prepare(
      `SELECT n.*,
        CASE WHEN n.cover_file_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM files cf WHERE cf.id = n.cover_file_id AND cf.mime LIKE 'image/%'
      ) THEN '/media/' || n.cover_file_id ELSE NULL END AS cover_url
       FROM notes n WHERE n.id = ?`
    )
    .get(id) as Note | undefined;
  if (!note) return null;
  const mapped = plain(note);
  mapped.domains = getNoteDomains(mapped.id);
  if (!mapped.domains.length && mapped.domain) mapped.domains = [mapped.domain];
  return mapped;
}

export function getNoteFiles(noteId: number) {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT nf.id, nf.file_id, nf.role, nf.sort, f.orig_name, f.mime,
              '/media/' || f.id AS url
       FROM note_files nf
       JOIN files f ON f.id = nf.file_id
       WHERE nf.note_id = ?
       ORDER BY nf.role, nf.sort, nf.id`
    )
    .all(noteId) as NoteFile[];
  return rows.map(plain);
}

export function countNotes() {
  return (getDb().prepare("SELECT COUNT(*) AS c FROM notes WHERE active = 1 AND draft = 0").get() as { c: number }).c;
}

export function createDraft() {
  const db = getDb();
  const ts = nowIso();
  const slug = `draft-${Date.now()}`;
  const info = db
    .prepare(
      `INSERT INTO notes (title, type, domain, slug, body, snippet, active, draft, created_at, updated_at)
       VALUES ('', ?, ?, ?, '', '', 1, 1, ?, ?)`
    )
    .run(defaultTypeSlug(), defaultDomainSlug(), slug, ts, ts);
  const id = Number(info.lastInsertRowid);
  setNoteDomains(id, [defaultDomainSlug()]);
  return getNote(id)!;
}

export function saveNote(
  id: number,
  input: {
    title: string;
    type: string;
    domain?: string;
    domains?: string[];
    body: string;
    source?: string | null;
  }
) {
  const db = getDb();
  const existing = getNote(id);
  if (!existing) throw new Error("Заметка не найдена");

  const title = input.title.trim() || extractFallbackTitle(input.body);
  const slug = existing.draft ? uniqueSlug(slugify(title) || existing.slug, id) : existing.slug;
  const ts = nowIso();
  const snippet = snippetOf(input.body);
  const prompt_extract = extractPrompt(input.body);
  const domains = setNoteDomains(id, input.domains || (input.domain ? [input.domain] : existing.domains));

  db.prepare(
    `UPDATE notes SET
      title = ?, type = ?, domain = ?, slug = ?, body = ?, source = ?,
      snippet = ?, prompt_extract = ?, draft = 0, updated_at = ?
     WHERE id = ?`
  ).run(title, input.type, domains[0], slug, input.body, input.source || null, snippet, prompt_extract, ts, id);

  const updated = getNote(id)!;
  try {
    writeMirror(updated);
  } catch {
    // зеркало не блокирует сохранение элемента
  }
  return getNote(id)!;
}

function extractFallbackTitle(body: string) {
  const line = body.split("\n").find((l) => l.trim());
  return (line || "Без названия").replace(/^#+\s*/, "").slice(0, 120);
}

export function trashNote(id: number) {
  const db = getDb();
  const note = getNote(id);
  if (!note) throw new Error("Заметка не найдена");
  db.prepare("UPDATE notes SET active = 0, draft = 0, updated_at = ? WHERE id = ?").run(nowIso(), id);
  if (note.path) {
    const abs = absPath(note.path);
    if (fs.existsSync(abs)) {
      fs.mkdirSync(TRASH_DIR, { recursive: true });
      const dest = path.join(TRASH_DIR, `${new Date().toISOString().slice(0, 10)}_${path.basename(note.path)}`);
      fs.renameSync(abs, dest);
    }
    db.prepare("UPDATE notes SET path = NULL, file_hash = NULL WHERE id = ?").run(id);
  }
}

function writeMirror(note: Note) {
  const rel = path.posix.join("docs", note.type, note.domain, `${note.slug}.md`);
  const abs = absPath(rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });

  if (note.path && note.path !== rel) {
    const oldAbs = absPath(note.path);
    if (fs.existsSync(oldAbs) && oldAbs !== abs) {
      try {
        fs.unlinkSync(oldAbs);
      } catch {
        /* ignore */
      }
    }
  }

  const fm = [
    "---",
    `title: ${jsonish(note.title)}`,
    `type: ${note.type}`,
    `domain: ${note.domain}`,
    note.domains?.length ? `domains: [${note.domains.join(", ")}]` : null,
    note.source ? `source: ${jsonish(note.source)}` : null,
    `updated: ${note.updated_at.slice(0, 10)}`,
    "---",
    "",
  ]
    .filter((x) => x !== null)
    .join("\n");

  const body = note.body.replace(/^---[\s\S]*?\n---\s*/, "");
  const text = `${fm}${body.replace(/^\n/, "")}\n`;
  fs.writeFileSync(abs, text, "utf8");
  getDb()
    .prepare("UPDATE notes SET path = ?, file_hash = ?, file_mtime = ? WHERE id = ?")
    .run(rel, hashText(text), nowIso(), note.id);
}

function jsonish(value: string) {
  return JSON.stringify(value);
}

export function uniqueSlug(base: string, exceptId?: number) {
  const db = getDb();
  let slug = base;
  let n = 2;
  for (;;) {
    const row = exceptId
      ? (db.prepare("SELECT id FROM notes WHERE slug = ? AND id != ?").get(slug, exceptId) as { id: number } | undefined)
      : (db.prepare("SELECT id FROM notes WHERE slug = ?").get(slug) as { id: number } | undefined);
    if (!row) return slug;
    slug = `${base}-${n++}`;
  }
}

export function stats() {
  const db = getDb();
  const total = (db.prepare("SELECT COUNT(*) AS c FROM notes WHERE active = 1 AND draft = 0").get() as { c: number }).c;
  const byType = db
    .prepare(
      "SELECT type AS key, COUNT(*) AS c FROM notes WHERE active = 1 AND draft = 0 GROUP BY type"
    )
    .all() as { key: string; c: number }[];
  return { total, byType };
}

export { DOCS_DIR };
