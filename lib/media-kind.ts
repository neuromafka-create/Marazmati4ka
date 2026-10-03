export const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export const VIDEO_ALLOWED: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

export const DOC_ALLOWED: Record<string, string> = {
  "application/pdf": "pdf",
};

export const MAX_BYTES = 15 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 500 * 1024 * 1024;
export const MAX_DOC_BYTES = 50 * 1024 * 1024;

export function isVideoMime(mime: string) {
  return mime.startsWith("video/");
}

export function isDocMime(mime: string) {
  return mime === "application/pdf";
}

function sniffVideo(buf: Buffer): string {
  const head = buf.subarray(0, Math.min(buf.length, 64));
  const ftypAt = head.indexOf("ftyp");
  if (ftypAt >= 0 && ftypAt + 8 <= buf.length) {
    const brand = buf.toString("ascii", ftypAt + 4, ftypAt + 8);
    if (brand === "qt  ") return "video/quicktime";
    return "video/mp4";
  }
  if (buf.length >= 4 && buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) {
    const ebml = buf.subarray(0, Math.min(buf.length, 256)).toString("latin1");
    if (ebml.includes("matroska") && !ebml.includes("webm")) return "";
    return "video/webm";
  }
  return "";
}

export function sniffMime(buf: Buffer, fallback = ""): string {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (buf.length >= 6 && buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return "image/gif";
  if (
    buf.length >= 12 &&
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  const video = sniffVideo(buf);
  if (video) return video;
  if (buf.length >= 4 && buf.toString("ascii", 0, 4) === "%PDF") return "application/pdf";
  if (fallback.startsWith("image/")) return fallback;
  if (VIDEO_ALLOWED[fallback]) return fallback;
  if (fallback === "video/x-m4v") return "video/mp4";
  if (DOC_ALLOWED[fallback]) return fallback;
  return "";
}
