import fs from "node:fs";
import { Readable } from "node:stream";
import { parseByteRange } from "./media-range";

export function serveStoredFile(req: Request, abs: string, mime: string, origName?: string) {
  const size = fs.statSync(abs).size;
  const headers: Record<string, string> = {
    "Content-Type": mime || "application/octet-stream",
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=31536000, immutable",
  };
  if (origName && mime === "application/pdf") {
    headers["Content-Disposition"] = pdfDisposition(origName);
  }
  const range = req.headers.get("range");
  if (!range) {
    if (size === 0) {
      return new Response(null, { status: 200, headers: { ...headers, "Content-Length": "0" } });
    }
    return streamSlice(abs, 0, size - 1, size, 200, headers);
  }
  const parsed = parseByteRange(range, size);
  if (!parsed) {
    return new Response(null, {
      status: 416,
      headers: { "Content-Range": `bytes */${size}` },
    });
  }
  return streamSlice(abs, parsed.start, parsed.end, size, 206, headers);
}

function pdfDisposition(name: string) {
  const base = name.replace(/[/\\]/g, "_").trim() || "file.pdf";
  const fallback = base.replace(/[^\x20-\x7E]/g, "_") || "file.pdf";
  const encoded = encodeURIComponent(base);
  return `inline; filename="${fallback}"; filename*=UTF-8''${encoded}`;
}

function streamSlice(
  abs: string,
  start: number,
  end: number,
  size: number,
  status: number,
  headers: Record<string, string>
) {
  const node = fs.createReadStream(abs, { start, end });
  const web = Readable.toWeb(node) as ReadableStream<Uint8Array>;
  const responseHeaders: Record<string, string> = {
    ...headers,
    "Content-Length": String(end - start + 1),
  };
  if (status === 206) responseHeaders["Content-Range"] = `bytes ${start}-${end}/${size}`;
  return new Response(web, { status, headers: responseHeaders });
}
