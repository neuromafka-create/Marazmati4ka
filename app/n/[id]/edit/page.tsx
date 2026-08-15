import { notFound } from "next/navigation";
import { Editor } from "@/components/Editor";
import { Shell } from "@/components/Shell";
import { getNote, getNoteFiles } from "@/lib/notes";
import { listTaxons, seedTaxons } from "@/lib/taxonomy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const note = getNote(Number(id));
  if (!note || !note.active) notFound();
  const files = getNoteFiles(note.id);
  seedTaxons();
  return (
    <Shell>
      <Editor
        noteId={note.id}
        initial={{
          title: note.title,
          type: note.type,
          domain: note.domain,
          domains: note.domains,
          body: note.body,
          source: note.source,
          draft: note.draft,
        }}
        files={files}
        types={listTaxons("type")}
        domains={listTaxons("domain")}
      />
    </Shell>
  );
}
