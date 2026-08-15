import { Library } from "@/components/Library";
import { AppShell } from "@/components/AppShell";
import { listNotes, parseDir, parseSort, stats, type Note } from "@/lib/notes";
import { taxonPayload } from "@/lib/taxonomy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    type?: string | string[];
    domain?: string | string[];
    sort?: string;
    dir?: string;
  }>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const types = Array.isArray(sp.type) ? sp.type : sp.type ? [sp.type] : [];
  const domains = Array.isArray(sp.domain) ? sp.domain : sp.domain ? [sp.domain] : [];
  const sort = parseSort(typeof sp.sort === "string" ? sp.sort : null);
  const dir = parseDir(typeof sp.dir === "string" ? sp.dir : null);
  let notes: Note[] = [];
  try {
    notes = listNotes({ q, types, domains, sort, dir });
  } catch {
    notes = [];
  }
  if (q) {
    const needle = q.toLowerCase();
    const fallback = listNotes({ types, domains, sort, dir }).filter((n) => {
      const hay = `${n.title}\n${n.snippet}`.toLowerCase();
      return hay.includes(needle);
    });
    if (!notes.length || fallback.length > notes.length) notes = fallback;
  }
  const { total } = stats();
  const tax = taxonPayload();
  const cards = notes.map((n) => ({
    id: Number(n.id),
    title: String(n.title || ""),
    type: n.type,
    domain: n.domain,
    domains: n.domains || (n.domain ? [n.domain] : []),
    snippet: String(n.snippet || ""),
    cover_url: n.cover_url ? String(n.cover_url) : null,
  }));
  return (
    <AppShell initialQuery={q}>
      <Library
        notes={cards}
        total={total}
        selectedTypes={types}
        selectedDomains={domains}
        query={q}
        types={tax.types}
        domains={tax.domains}
        typeLabels={tax.typeLabels}
        domainLabels={tax.domainLabels}
        sort={sort}
        dir={dir}
      />
    </AppShell>
  );
}
