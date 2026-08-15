import { notFound } from "next/navigation";
import { NoteView } from "@/components/NoteView";
import { AppShell } from "@/components/AppShell";
import { getNote, getNoteFiles } from "@/lib/notes";
import { publicSettings } from "@/lib/settings";
import { labelMap } from "@/lib/taxonomy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function NotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const note = getNote(Number(id));
  if (!note || !note.active) notFound();
  const files = getNoteFiles(note.id);
  const typeLabels = labelMap("type");
  const domainLabels = labelMap("domain");
  return (
    <AppShell>
      <NoteView
        note={{
          id: note.id,
          title: note.title,
          type: note.type,
          domain: note.domain,
          domains: note.domains,
          body: note.body,
          source: note.source,
          prompt_extract: note.prompt_extract,
        }}
        files={files}
        typeLabel={typeLabels[note.type] || note.type}
        domainLabels={(note.domains?.length ? note.domains : [note.domain]).map((d) => domainLabels[d] || d)}
        hasAiKey={publicSettings().hasKey}
      />
    </AppShell>
  );
}
