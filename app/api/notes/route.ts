import { NextResponse } from "next/server";
import { createDraft, listNotes, parseDir, parseSort } from "@/lib/notes";

export const runtime = "nodejs";

export function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") || undefined;
  const types = url.searchParams.getAll("type");
  const domains = url.searchParams.getAll("domain");
  const sort = parseSort(url.searchParams.get("sort"));
  const dir = parseDir(url.searchParams.get("dir"));
  try {
    const notes = listNotes({ q, types, domains, sort, dir });
    return NextResponse.json({ notes });
  } catch {
    const notes = listNotes({ types, domains, sort, dir });
    const needle = (q || "").toLowerCase();
    const filtered = needle
      ? notes.filter(
          (n) =>
            n.title.toLowerCase().includes(needle) ||
            n.body.toLowerCase().includes(needle) ||
            n.snippet.toLowerCase().includes(needle)
        )
      : notes;
    return NextResponse.json({ notes: filtered });
  }
}

export function POST() {
  const note = createDraft();
  return NextResponse.json({ note });
}
