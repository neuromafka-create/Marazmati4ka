import { NextResponse } from "next/server";
import { testHubrisConnection } from "@/lib/hubris";

export const runtime = "nodejs";

export async function POST() {
  try {
    const result = await testHubrisConnection();
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Не удалось проверить" }, { status: 400 });
  }
}
