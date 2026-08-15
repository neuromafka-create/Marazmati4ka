import fs from "node:fs";
import path from "node:path";
import { getDb } from "./db";
import { slugify } from "./markdown";
import { getBrand } from "./brand";
import { absPath, DOCS_DIR } from "./paths";

export type TaxonKind = "type" | "domain";

export type Taxon = {
  id: number;
  kind: TaxonKind;
  slug: string;
  label: string;
  sort: number;
};

const SEED_MARAZ: { kind: TaxonKind; slug: string; label: string; sort: number }[] = [
  { kind: "type", slug: "prompt", label: "Промпт", sort: 0 },
  { kind: "type", slug: "guide", label: "Инструкция", sort: 1 },
  { kind: "type", slug: "catalog", label: "Подборка", sort: 2 },
  { kind: "type", slug: "article", label: "Заметка", sort: 3 },
  { kind: "type", slug: "reference", label: "Шпаргалка", sort: 4 },
  { kind: "domain", slug: "image", label: "Графика", sort: 0 },
  { kind: "domain", slug: "video", label: "Видео", sort: 1 },
  { kind: "domain", slug: "copy", label: "Тексты", sort: 2 },
  { kind: "domain", slug: "marketing", label: "Маркетинг", sort: 3 },
  { kind: "domain", slug: "analytics", label: "Аналитика", sort: 4 },
  { kind: "domain", slug: "agents", label: "Агенты", sort: 5 },
  { kind: "domain", slug: "coding", label: "Код", sort: 6 },
  { kind: "domain", slug: "tools", label: "Инструменты", sort: 7 },
  { kind: "domain", slug: "education", label: "Учёба", sort: 8 },
  { kind: "domain", slug: "business", label: "Бизнес", sort: 9 },
];

const SEED_EMPTY: { kind: TaxonKind; slug: string; label: string; sort: number }[] = [
  { kind: "type", slug: "note", label: "Заметка", sort: 0 },
  { kind: "type", slug: "list", label: "Список", sort: 1 },
  { kind: "type", slug: "idea", label: "Идея", sort: 2 },
  { kind: "type", slug: "howto", label: "Инструкция", sort: 3 },
  { kind: "type", slug: "link", label: "Ссылка", sort: 4 },
  { kind: "domain", slug: "personal", label: "Личное", sort: 0 },
  { kind: "domain", slug: "work", label: "Работа", sort: 1 },
  { kind: "domain", slug: "home", label: "Дом", sort: 2 },
  { kind: "domain", slug: "study", label: "Учёба", sort: 3 },
  { kind: "domain", slug: "health", label: "Здоровье", sort: 4 },
  { kind: "domain", slug: "money", label: "Финансы", sort: 5 },
  { kind: "domain", slug: "misc", label: "Разное", sort: 6 },
];

function plain<T>(row: T): T {
  return row ? (JSON.parse(JSON.stringify(row)) as T) : row;
}

export function seedTaxons() {
  const db = getDb();
  const n = (db.prepare("SELECT COUNT(*) AS c FROM taxons").get() as { c: number }).c;
  if (n > 0) return;
  const seed = getBrand().empty ? SEED_EMPTY : SEED_MARAZ;
  const ins = db.prepare("INSERT INTO taxons (kind, slug, label, sort) VALUES (?, ?, ?, ?)");
  for (const row of seed) ins.run(row.kind, row.slug, row.label, row.sort);
}

export function listTaxons(kind?: TaxonKind) {
  const db = getDb();
  const rows = kind
    ? (db.prepare("SELECT * FROM taxons WHERE kind = ? ORDER BY sort, id").all(kind) as Taxon[])
    : (db.prepare("SELECT * FROM taxons ORDER BY kind, sort, id").all() as Taxon[]);
  return rows.map(plain);
}

export function getTaxon(id: number) {
  const row = getDb().prepare("SELECT * FROM taxons WHERE id = ?").get(id) as Taxon | undefined;
  return row ? plain(row) : null;
}

export function getTaxonBySlug(kind: TaxonKind, slug: string) {
  const row = getDb().prepare("SELECT * FROM taxons WHERE kind = ? AND slug = ?").get(kind, slug) as
    | Taxon
    | undefined;
  return row ? plain(row) : null;
}

export function isType(v: string) {
  return Boolean(getTaxonBySlug("type", v));
}

export function isDomain(v: string) {
  return Boolean(getTaxonBySlug("domain", v));
}

export function labelMap(kind: TaxonKind) {
  const map: Record<string, string> = {};
  for (const t of listTaxons(kind)) map[t.slug] = t.label;
  return map;
}

export function defaultTypeSlug() {
  return listTaxons("type")[0]?.slug || (getBrand().empty ? "note" : "prompt");
}

export function defaultDomainSlug() {
  return listTaxons("domain")[0]?.slug || (getBrand().empty ? "personal" : "image");
}

export function ensureTaxon(kind: TaxonKind, slug: string, label?: string) {
  const existing = getTaxonBySlug(kind, slug);
  if (existing) return existing;
  return createTaxon({ kind, slug, label: label || slug });
}

function normalizeSlug(raw: string) {
  const slug = slugify(raw).replace(/[^a-z0-9-]/g, "");
  if (!slug) throw new Error("Пустой код. Латиница, цифры, дефис.");
  return slug.slice(0, 40);
}

export function createTaxon(input: { kind: TaxonKind; label: string; slug?: string }) {
  if (input.kind !== "type" && input.kind !== "domain") throw new Error("Неверный вид справочника");
  const label = input.label.trim();
  if (!label) throw new Error("Нужно название");
  const slug = normalizeSlug(input.slug || label);
  if (getTaxonBySlug(input.kind, slug)) throw new Error("Такой код уже есть");
  const db = getDb();
  const sort =
    (db.prepare("SELECT COALESCE(MAX(sort), -1) + 1 AS s FROM taxons WHERE kind = ?").get(input.kind) as { s: number })
      .s ?? 0;
  const info = db.prepare("INSERT INTO taxons (kind, slug, label, sort) VALUES (?, ?, ?, ?)").run(
    input.kind,
    slug,
    label,
    sort
  );
  return getTaxon(Number(info.lastInsertRowid))!;
}

export function updateTaxon(id: number, input: { label?: string; slug?: string }) {
  const current = getTaxon(id);
  if (!current) throw new Error("Не найдено");
  const label = input.label !== undefined ? input.label.trim() : current.label;
  if (!label) throw new Error("Нужно название");
  const slug = input.slug !== undefined ? normalizeSlug(input.slug) : current.slug;
  if (slug !== current.slug) {
    const clash = getTaxonBySlug(current.kind, slug);
    if (clash && clash.id !== id) throw new Error("Такой код уже есть");
    rekeyNotes(current.kind, current.slug, slug);
  }
  getDb().prepare("UPDATE taxons SET label = ?, slug = ? WHERE id = ?").run(label, slug, id);
  return getTaxon(id)!;
}

export function usageCount(kind: TaxonKind, slug: string) {
  const db = getDb();
  if (kind === "type") {
    return (db.prepare("SELECT COUNT(*) AS c FROM notes WHERE type = ?").get(slug) as { c: number }).c;
  }
  return (db.prepare("SELECT COUNT(DISTINCT note_id) AS c FROM note_domains WHERE domain_slug = ?").get(slug) as { c: number }).c;
}

export function deleteTaxon(id: number, reassignTo?: string) {
  const current = getTaxon(id);
  if (!current) throw new Error("Не найдено");
  const used = usageCount(current.kind, current.slug);
  if (used > 0) {
    if (!reassignTo) {
      const err = new Error(`Используется в ${used} записях. Укажите, куда перенести.`);
      (err as Error & { code?: string; used?: number }).code = "IN_USE";
      (err as Error & { used?: number }).used = used;
      throw err;
    }
    const target = getTaxonBySlug(current.kind, reassignTo);
    if (!target || target.id === current.id) throw new Error("Некуда переносить");
    rekeyNotes(current.kind, current.slug, target.slug);
  }
  getDb().prepare("DELETE FROM taxons WHERE id = ?").run(id);
}

function rekeyNotes(kind: TaxonKind, from: string, to: string) {
  const db = getDb();
  if (kind === "domain") {
    const links = db.prepare("SELECT note_id FROM note_domains WHERE domain_slug = ?").all(from) as { note_id: number }[];
    for (const { note_id } of links) {
      const hasTo = db.prepare("SELECT 1 AS x FROM note_domains WHERE note_id = ? AND domain_slug = ?").get(note_id, to);
      if (hasTo) {
        db.prepare("DELETE FROM note_domains WHERE note_id = ? AND domain_slug = ?").run(note_id, from);
      } else {
        db.prepare("UPDATE note_domains SET domain_slug = ? WHERE note_id = ? AND domain_slug = ?").run(to, note_id, from);
      }
    }
    db.prepare("UPDATE notes SET domain = ? WHERE domain = ?").run(to, from);
  }

  const col = kind === "type" ? "type" : "domain";
  const notes = db.prepare(`SELECT id, type, domain, path FROM notes WHERE ${col} = ?`).all(kind === "type" ? from : to) as {
    id: number;
    type: string;
    domain: string;
    path: string | null;
  }[];
  const upd = db.prepare("UPDATE notes SET path = ? WHERE id = ?");
  if (kind === "type") {
    db.prepare("UPDATE notes SET type = ? WHERE type = ?").run(to, from);
  }
  for (const note of notes) {
    const nextType = kind === "type" ? to : note.type;
    const nextDomain = note.domain;
    if (!note.path) continue;
    const dest = path.join(DOCS_DIR, nextType, nextDomain, path.basename(note.path));
    const src = absPath(note.path);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    if (fs.existsSync(src) && src !== dest) {
      try {
        fs.renameSync(src, dest);
      } catch {
        /* зеркало не блокирует */
      }
    }
    upd.run(path.posix.join("docs", nextType, nextDomain, path.basename(note.path)), note.id);
  }
}

export function taxonPayload() {
  seedTaxons();
  return {
    types: listTaxons("type"),
    domains: listTaxons("domain"),
    typeLabels: labelMap("type"),
    domainLabels: labelMap("domain"),
  };
}
