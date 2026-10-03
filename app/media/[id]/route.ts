import fs from "node:fs";
import { NextResponse } from "next/server";
import { absoluteFilePath, getFileRow } from "@/lib/files";
import { serveStoredFile } from "@/lib/media-http";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const row = getFileRow(Number(id));
  if (!row) return new NextResponse("Not found", { status: 404 });
  const abs = absoluteFilePath(row.path);
  if (!fs.existsSync(abs)) return new NextResponse("Missing file", { status: 404 });
  return serveStoredFile(_req, abs, row.mime, row.orig_name);
}
