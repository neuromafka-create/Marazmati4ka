import Link from "next/link";
import { Filters } from "./Filters";
import { SortBar } from "./SortBar";
import type { NoteDir, NoteSort } from "@/lib/notes";
import type { Taxon } from "@/lib/taxonomy";

export type CardNote = {
  id: number;
  title: string;
  type: string;
  domain: string;
  domains?: string[];
  snippet: string;
  cover_url?: string | null;
};

export function Library({
  notes,
  total,
  selectedTypes,
  selectedDomains,
  query,
  types,
  domains,
  typeLabels,
  domainLabels,
  sort,
  dir,
}: {
  notes: CardNote[];
  total: number;
  selectedTypes: string[];
  selectedDomains: string[];
  query: string;
  types: Taxon[];
  domains: Taxon[];
  typeLabels: Record<string, string>;
  domainLabels: Record<string, string>;
  sort: NoteSort;
  dir: NoteDir;
}) {
  return (
    <div className="layout">
      <Filters
        types={types}
        domains={domains}
        selectedTypes={selectedTypes}
        selectedDomains={selectedDomains}
        query={query}
        sort={sort}
        dir={dir}
      />
      <section className="main">
        <div className="meta-row">
          <span>
            {notes.length}
            {notes.length !== total ? ` из ${total}` : ""} записей
          </span>
          <SortBar
            query={query}
            selectedTypes={selectedTypes}
            selectedDomains={selectedDomains}
            sort={sort}
            dir={dir}
          />
          {(selectedTypes.length || selectedDomains.length || query) && (
            <Link href={sort !== "updated" || dir !== "desc" ? `/?sort=${sort}&dir=${dir}` : "/"}>
              сбросить фильтры
            </Link>
          )}
        </div>
        {notes.length === 0 ? (
          <div className="empty">Ничего не нашлось. Снимите фильтр или добавьте заметку.</div>
        ) : (
          <div className="grid">
            {notes.map((n) => (
              <article key={n.id} className="card">
                <Link href={`/n/${n.id}`} className="card-main">
                  <div className="card-cover">{n.cover_url ? <img src={n.cover_url} alt="" /> : null}</div>
                  <div className="card-body">
                    <div className="card-tags">
                      <span className="tag">{typeLabels[n.type] || n.type}</span>
                      {(n.domains?.length ? n.domains : n.domain ? [n.domain] : []).map((d) => (
                        <span className="tag" key={d}>
                          {domainLabels[d] || d}
                        </span>
                      ))}
                    </div>
                    <h3>{n.title || "Без названия"}</h3>
                    {n.snippet ? <p>{n.snippet}</p> : null}
                  </div>
                </Link>
                <Link href={`/n/${n.id}/edit`} className="card-edit" title="Править" aria-label="Править">
                  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                    <path
                      fill="currentColor"
                      d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm17.71-10.04a1 1 0 0 0 0-1.41l-2.51-2.51a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 2-1.66z"
                    />
                  </svg>
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
