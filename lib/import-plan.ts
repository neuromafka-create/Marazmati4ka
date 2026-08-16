import fs from "node:fs";
import path from "node:path";
import { slugify } from "./markdown";

const TEXT_EXT = new Set([".md", ".markdown", ".txt"]);
const SKIP_DIR = new Set([".git", "node_modules", ".next", "dist-desktop", "_trash", "_sort"]);
export const MAX_SEED_FILES = 2000;
export const MAX_SEED_BYTES = 2 * 1024 * 1024;

export function classifyImportPath(rel: string, fallbackType: string, fallbackDomain: string) {
  const parts = rel.split(/[/\\]/).filter(Boolean);
  const name = parts.pop() || "note.md";
  if (parts[0] === "docs") parts.shift();
  if (parts.length >= 2) {
    return { type: slugify(parts[0]) || fallbackType, domain: slugify(parts[1]) || fallbackDomain, name };
  }
  if (parts.length === 1) {
    return { type: fallbackType, domain: slugify(parts[0]) || fallbackDomain, name };
  }
  return { type: fallbackType, domain: fallbackDomain, name };
}

export function walkTextFiles(dir: string, acc: string[] = []) {
  if (!fs.existsSync(dir) || acc.length >= MAX_SEED_FILES) return acc;
  let entries: fs.Dirent[] = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const name of entries) {
    if (acc.length >= MAX_SEED_FILES) break;
    if (name.name.startsWith(".")) continue;
    const full = path.join(dir, name.name);
    if (name.isDirectory()) {
      if (SKIP_DIR.has(name.name.toLowerCase())) continue;
      walkTextFiles(full, acc);
      continue;
    }
    if (!name.isFile()) continue;
    const ext = path.extname(name.name).toLowerCase();
    if (!TEXT_EXT.has(ext)) continue;
    try {
      if (fs.statSync(full).size > MAX_SEED_BYTES) continue;
    } catch {
      continue;
    }
    acc.push(full);
  }
  return acc;
}

export function planSeedCopies(
  sourceDir: string,
  fallbackType: string,
  fallbackDomain: string
): { from: string; type: string; domain: string; destName: string }[] {
  const src = path.resolve(sourceDir);
  if (!src || !fs.existsSync(src) || !fs.statSync(src).isDirectory()) return [];
  return walkTextFiles(src).map((abs) => {
    const classified = classifyImportPath(path.relative(src, abs), fallbackType, fallbackDomain);
    const type = classified.type.startsWith(".") ? fallbackType : classified.type;
    const domain = classified.domain.startsWith(".") ? fallbackDomain : classified.domain;
    let destName = classified.name;
    const ext = path.extname(destName).toLowerCase();
    if (ext === ".txt" || ext === ".markdown") {
      destName = `${path.basename(destName, ext)}.md`;
    }
    return { from: abs, type, domain, destName };
  });
}
