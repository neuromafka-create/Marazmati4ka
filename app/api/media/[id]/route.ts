import fs from "node:fs";
import { NextResponse } from "next/server";
import { getFileRow } from "@/lib/files";
import { serveStoredFile } from "@/lib/media-http";
import { absPath } from "@/lib/paths";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const row = getFileRow(Number(id));
  if (!row) return new NextResponse("Not found", { status: 404 });
  const abs = absPath(row.path);
  if (!fs.existsSync(abs)) return new NextResponse("Missing file", { status: 404 });
  return serveStoredFile(req, abs, row.mime, row.orig_name);
}
