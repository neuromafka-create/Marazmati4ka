import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { getFileRow } from "@/lib/files";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const row = getFileRow(Number(id));
  if (!row) return new NextResponse("Not found", { status: 404 });
  const abs = path.join(process.cwd(), row.path);
  if (!fs.existsSync(abs)) return new NextResponse("Missing file", { status: 404 });
  const buf = fs.readFileSync(abs);
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": row.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
