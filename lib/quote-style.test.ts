import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_QUOTE_STYLE,
  QUOTE_STYLES,
  isQuoteStyleId,
  parseQuoteStyle,
} from "./quote-style.ts";

test("five quote palettes, bronze is the default", () => {
  assert.equal(QUOTE_STYLES.length, 5);
  assert.equal(DEFAULT_QUOTE_STYLE, "bronze");
  assert.deepEqual(
    QUOTE_STYLES.map((s) => s.id),
    ["bronze", "graphite", "forest", "wine", "ink"]
  );
});

test("unknown quote style falls back to bronze", () => {
  assert.equal(parseQuoteStyle("wine"), "wine");
  assert.equal(parseQuoteStyle(""), DEFAULT_QUOTE_STYLE);
  assert.equal(parseQuoteStyle("nope"), DEFAULT_QUOTE_STYLE);
  assert.equal(isQuoteStyleId("forest"), true);
  assert.equal(isQuoteStyleId("custom"), false);
});
