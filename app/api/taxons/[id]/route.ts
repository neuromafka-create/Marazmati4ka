import { NextResponse } from "next/server";
import { deleteTaxon, getTaxon, updateTaxon, usageCount } from "@/lib/taxonomy";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await req.json();
  try {
    const taxon = updateTaxon(Number(id), {
      label: body.label !== undefined ? String(body.label) : undefined,
      slug: body.slug !== undefined ? String(body.slug) : undefined,
    });
    return NextResponse.json({ taxon });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Ошибка" }, { status: 400 });
  }
}

export async function DELETE(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const url = new URL(req.url);
  const reassignTo = url.searchParams.get("reassign") || undefined;
  const current = getTaxon(Number(id));
  if (!current) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  try {
    deleteTaxon(Number(id), reassignTo);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const used = usageCount(current.kind, current.slug);
    const message = err instanceof Error ? err.message : "Ошибка";
    const status = (err as { code?: string }).code === "IN_USE" ? 409 : 400;
    return NextResponse.json({ error: message, used }, { status });
  }
}
