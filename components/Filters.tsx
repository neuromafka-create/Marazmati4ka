"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { libraryUrl } from "@/lib/library-url";
import type { NoteDir, NoteSort } from "@/lib/notes";
import type { Taxon } from "@/lib/taxonomy";

export function Filters({
  types,
  domains,
  selectedTypes,
  selectedDomains,
  query,
  sort,
  dir,
}: {
  types: Taxon[];
  domains: Taxon[];
  selectedTypes: string[];
  selectedDomains: string[];
  query: string;
  sort: NoteSort;
  dir: NoteDir;
}) {
  const router = useRouter();

  function toggle(kind: "type" | "domain", value: string) {
    const nextTypes = new Set(selectedTypes);
    const nextDomains = new Set(selectedDomains);
    const bag = kind === "type" ? nextTypes : nextDomains;
    if (bag.has(value)) bag.delete(value);
    else bag.add(value);
    router.push(
      libraryUrl({
        q: query,
        types: [...nextTypes],
        domains: [...nextDomains],
        sort,
        dir,
      })
    );
  }

  return (
    <aside className="sidebar">
      <h2>Тип</h2>
      <div className="chip-list">
        {types.map((t) => (
          <button
            key={t.slug}
            type="button"
            className={`chip ${selectedTypes.includes(t.slug) ? "on" : ""}`}
            onClick={() => toggle("type", t.slug)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <h2>Область</h2>
      <div className="chip-list">
        {domains.map((d) => (
          <button
            key={d.slug}
            type="button"
            className={`chip ${selectedDomains.includes(d.slug) ? "on" : ""}`}
            onClick={() => toggle("domain", d.slug)}
          >
            {d.label}
          </button>
        ))}
      </div>
      <p className="sidebar-link">
        <Link href="/settings">править справочники</Link>
      </p>
    </aside>
  );
}
