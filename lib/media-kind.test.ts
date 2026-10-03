import assert from "node:assert/strict";
import test from "node:test";
import { sniffMime } from "./media-kind.ts";
import { parseByteRange } from "./media-range.ts";

test("jpeg magic stays an image", () => {
  assert.equal(sniffMime(Buffer.from([0xff, 0xd8, 0xff, 0xe0])), "image/jpeg");
});

test("mp4 ftyp is video/mp4", () => {
  const buf = Buffer.alloc(16);
  buf.write("ftypisom", 4);
  assert.equal(sniffMime(buf), "video/mp4");
});

test("quicktime brand is video/quicktime", () => {
  const buf = Buffer.alloc(16);
  buf.write("ftypqt  ", 4);
  assert.equal(sniffMime(buf), "video/quicktime");
});

test("webm ebml is video/webm", () => {
  const buf = Buffer.alloc(32);
  buf[0] = 0x1a;
  buf[1] = 0x45;
  buf[2] = 0xdf;
  buf[3] = 0xa3;
  buf.write("webm", 8);
  assert.equal(sniffMime(buf), "video/webm");
});

test("matroska is not accepted as webm", () => {
  const buf = Buffer.alloc(32);
  buf[0] = 0x1a;
  buf[1] = 0x45;
  buf[2] = 0xdf;
  buf[3] = 0xa3;
  buf.write("matroska", 8);
  assert.equal(sniffMime(buf), "");
});

test("pdf magic is application/pdf", () => {
  assert.equal(sniffMime(Buffer.from("%PDF-1.7\n")), "application/pdf");
});

test("browser application/pdf is kept when magic is missing", () => {
  assert.equal(sniffMime(Buffer.from("not-a-pdf"), "application/pdf"), "application/pdf");
});

test("browser video/mp4 is kept when magic is missing", () => {
  assert.equal(sniffMime(Buffer.from("not-a-container"), "video/mp4"), "video/mp4");
});

test("parseByteRange reads open, closed and suffix ranges", () => {
  assert.deepEqual(parseByteRange("bytes=0-", 10), { start: 0, end: 9 });
  assert.deepEqual(parseByteRange("bytes=2-5", 10), { start: 2, end: 5 });
  assert.deepEqual(parseByteRange("bytes=-4", 10), { start: 6, end: 9 });
  assert.equal(parseByteRange("bytes=10-11", 10), null);
  assert.equal(parseByteRange("bytes=0-1,2-3", 10)?.start, 0);
});
