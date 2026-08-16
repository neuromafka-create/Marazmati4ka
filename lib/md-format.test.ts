import assert from "node:assert/strict";
import test from "node:test";
import { canApplyLink, defaultLinkUrl, wrapLink } from "./md-format.ts";

test("wrapLink wraps selected text", () => {
  const next = wrapLink("смотрите сюда сейчас", 9, 13, "https://example.com");
  assert.equal(next.text, "смотрите [сюда](https://example.com) сейчас");
  assert.equal(next.start, 10);
  assert.equal(next.end, 14);
});

test("wrapLink inserts a placeholder when nothing is selected", () => {
  const next = wrapLink("абзац", 5, 5, "https://hubris.pw");
  assert.equal(next.text, "абзац[ссылка](https://hubris.pw)");
});

test("empty or unfinished URL must not be applied", () => {
  assert.equal(canApplyLink(""), false);
  assert.equal(canApplyLink("   "), false);
  assert.equal(canApplyLink("https://"), false);
  assert.equal(canApplyLink("https://example.com"), true);
  assert.equal(canApplyLink("/n/42"), true);
});

test("defaultLinkUrl reuses a selected address", () => {
  assert.equal(defaultLinkUrl("https://hubris.pw/docs"), "https://hubris.pw/docs");
  assert.equal(defaultLinkUrl("просто текст"), "https://");
});
