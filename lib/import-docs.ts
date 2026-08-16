import fs from "node:fs";
import path from "node:path";
import { getDb } from "./db";
import { attachFile } from "./files";
import {
  extractSource,
  extractTitle,
  hashText,
  nowIso,
  slugify,
  snippetOf,
  stripFrontmatter,
  extractBase64Images,
  extractPrompt,
} from "./markdown";
import { setNoteDomains } from "./notes";
import { defaultDomainSlug, defaultTypeSlug, ensureTaxon } from "./taxonomy";
import { DOCS_DIR, ROOT } from "./paths";
import { planSeedCopies } from "./import-plan";

export { classifyImportPath, planSeedCopies } from "./import-plan";

function walkMd(dir: string, acc: string[] = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, name.name);
    if (name.isDirectory()) walkMd(full, acc);
    else if (name.isFile() && name.name.toLowerCase().endsWith(".md")) acc.push(full);
  }
  return acc;
}

export function importDocs() {
  const db = getDb();
  const files = walkMd(DOCS_DIR);
  let created = 0;
  let skipped = 0;
  let conflicts = 0;

  for (const abs of files) {
    const rel = path.relative(ROOT, abs).split(path.sep).join("/");
    const parts = rel.split("/");
    // docs / type / domain / file.md
    const type = parts[1] || "";
    const domain = parts[2] || "";
    if (!type || !domain || type.startsWith(".")) {
      skipped += 1;
      continue;
    }
    ensureTaxon("type", type, type);
    ensureTaxon("domain", domain, domain);

    const existing = db.prepare("SELECT id, file_hash FROM notes WHERE path = ?").get(rel) as
      | { id: number; file_hash: string | null }
      | undefined;

    let raw = "";
    try {
      raw = fs.readFileSync(abs, "utf8");
    } catch {
      skipped += 1;
      continue;
    }

    const hash = hashText(raw);
    if (existing) {
      if (existing.file_hash === hash) {
        skipped += 1;
        continue;
      }
      conflicts += 1;
      continue;
    }

    const body0 = stripFrontmatter(raw);
    const { body: withTokens, images } = extractBase64Images(body0);
    const title = extractTitle(body0, path.basename(abs, ".md"));
    const source = extractSource(body0);
    const snippet = snippetOf(body0);
    const prompt_extract = type === "prompt" ? extractPrompt(body0) : null;
    const slugBase = slugify(path.basename(abs, ".md")) || slugify(title);
    const ts = nowIso();
    const stat = fs.statSync(abs);

    const info = db
      .prepare(
        `INSERT INTO notes
          (title, type, domain, slug, body, source, snippet, prompt_extract, path, file_hash, file_mtime, active, draft, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?)`
      )
      .run(
        title,
        type,
        domain,
        `${slugBase}-${created + 1}`,
        withTokens,
        source,
        snippet,
        prompt_extract,
        rel,
        hash,
        stat.mtime.toISOString(),
        ts,
        ts
      );
    const noteId = Number(info.lastInsertRowid);
    setNoteDomains(noteId, [domain]);
    created += 1;

    let bodyFinal = withTokens;
    images.forEach((img, i) => {
      const attached = attachFile({
        noteId,
        buffer: img.data,
        mime: img.mime,
        origName: `embedded-${i + 1}.${img.ext}`,
        role: i === 0 ? "cover" : "inline",
      });
      bodyFinal = bodyFinal.replace(img.placeholder, `/media/${attached.id}`);
    });
    if (images.length) {
      db.prepare("UPDATE notes SET body = ?, snippet = ? WHERE id = ?").run(
        bodyFinal,
        snippetOf(bodyFinal),
        noteId
      );
    }
  }

  return { scanned: files.length, created, skipped, conflicts };
}

function uniqueDest(dir: string, filename: string, used: Set<string>) {
  const ext = path.extname(filename);
  const base = path.basename(filename, ext);
  let dest = path.join(dir, filename);
  let n = 2;
  while (used.has(dest) || fs.existsSync(dest)) {
    dest = path.join(dir, `${base}-${n++}${ext}`);
  }
  used.add(dest);
  return dest;
}

/** Copy loose notes from a user folder into docs/<type>/<domain>/ so importDocs can pick them up. */
export function seedDocsFromFolder(sourceDir: string, destDocs = DOCS_DIR) {
  const plans = planSeedCopies(sourceDir, defaultTypeSlug(), defaultDomainSlug());
  const used = new Set<string>();
  let copied = 0;
  for (const plan of plans) {
    ensureTaxon("type", plan.type, plan.type);
    ensureTaxon("domain", plan.domain, plan.domain);
    const destDir = path.join(destDocs, plan.type, plan.domain);
    fs.mkdirSync(destDir, { recursive: true });
    const dest = uniqueDest(destDir, plan.destName, used);
    try {
      fs.copyFileSync(plan.from, dest);
      copied += 1;
    } catch {
      /* skip unreadable */
    }
  }
  return { scanned: plans.length, copied };
}
