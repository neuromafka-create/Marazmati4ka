import assert from "node:assert/strict";
import test from "node:test";
import {
  FALLBACK_COVER,
  PLACEHOLDER_PRESETS,
  customCoverSrc,
  isPlaceholderCoverId,
  presetCoverSrc,
} from "./placeholder-cover.ts";

test("five themed presets plus the notebook default exist", () => {
  assert.equal(PLACEHOLDER_PRESETS.length, 6);
  assert.deepEqual(
    PLACEHOLDER_PRESETS.map((p) => p.id),
    ["notebook", "cooking", "web", "games", "animals", "tales"]
  );
});

test("unknown id falls back to the notebook photo", () => {
  assert.equal(presetCoverSrc("nope"), FALLBACK_COVER);
  assert.equal(presetCoverSrc("cooking"), "/covers/cooking.jpg");
});

test("custom and preset ids are accepted", () => {
  assert.equal(isPlaceholderCoverId("tales"), true);
  assert.equal(isPlaceholderCoverId("custom"), true);
  assert.equal(isPlaceholderCoverId("cover"), false);
});

test("custom url carries a cache-busting query", () => {
  assert.equal(customCoverSrc("42"), "/api/settings/cover?v=42");
  assert.equal(customCoverSrc(""), "/api/settings/cover");
});
