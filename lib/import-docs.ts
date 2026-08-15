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
import { ensureTaxon } from "./taxonomy";
import { DOCS_DIR } from "./paths";

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
    const rel = path.relative(process.cwd(), abs).split(path.sep).join("/");
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
