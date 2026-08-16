import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { slugify } from "./markdown.ts";

function classifyImportPath(rel: string, fallbackType: string, fallbackDomain: string) {
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

test("classifyImportPath uses two folders as type and domain", () => {
  const got = classifyImportPath("docs/note/work/plan.md", "note", "personal");
  assert.deepEqual(got, { type: "note", domain: "work", name: "plan.md" });
});

test("classifyImportPath uses a single folder as domain", () => {
  const got = classifyImportPath("работа/идея.md", "note", "personal");
  assert.equal(got.type, "note");
  assert.equal(got.domain, "rabota");
  assert.equal(got.name, "идея.md");
});

test("classifyImportPath falls back for a loose file", () => {
  const got = classifyImportPath("inbox.txt", "note", "personal");
  assert.deepEqual(got, { type: "note", domain: "personal", name: "inbox.txt" });
});

test("loose txt becomes md; a single folder becomes domain", () => {
  const src = fs.mkdtempSync(path.join(os.tmpdir(), "skl-src-"));
  try {
    fs.writeFileSync(path.join(src, "hello.txt"), "привет");
    fs.mkdirSync(path.join(src, "дом"));
    fs.writeFileSync(path.join(src, "дом", "список.md"), "# Список");
    const files = ["hello.txt", path.join("дом", "список.md")];
    const plans = files.map((rel) => {
      const c = classifyImportPath(rel, "note", "personal");
      const ext = path.extname(c.name).toLowerCase();
      const destName = ext === ".txt" || ext === ".markdown" ? `${path.basename(c.name, ext)}.md` : c.name;
      return { ...c, destName };
    });
    const byName = Object.fromEntries(plans.map((p) => [p.destName, p]));
    assert.equal(byName["hello.md"].type, "note");
    assert.equal(byName["hello.md"].domain, "personal");
    assert.equal(byName["список.md"].type, "note");
    assert.equal(byName["список.md"].domain, "dom");
  } finally {
    fs.rmSync(src, { recursive: true, force: true });
  }
});
