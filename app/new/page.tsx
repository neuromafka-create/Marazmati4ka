import { redirect } from "next/navigation";
import { createDraft } from "@/lib/notes";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default function NewPage() {
  const note = createDraft();
  redirect(`/n/${note.id}/edit`);
}
