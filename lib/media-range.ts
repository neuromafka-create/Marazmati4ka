export function parseByteRange(header: string, size: number): { start: number; end: number } | null {
  const first = header.trim().split(",")[0]?.trim() ?? "";
  const match = /^bytes=(\d*)-(\d*)$/.exec(first);
  if (!match || size <= 0) return null;
  const startStr = match[1];
  const endStr = match[2];
  if (startStr === "" && endStr === "") return null;
  if (startStr === "") {
    const suffix = Number(endStr);
    if (!Number.isInteger(suffix) || suffix <= 0) return null;
    return { start: Math.max(0, size - suffix), end: size - 1 };
  }
  const start = Number(startStr);
  const end = endStr === "" ? size - 1 : Number(endStr);
  if (!Number.isInteger(start) || !Number.isInteger(end)) return null;
  if (start < 0 || start >= size || end < start) return null;
  return { start, end: Math.min(end, size - 1) };
}
