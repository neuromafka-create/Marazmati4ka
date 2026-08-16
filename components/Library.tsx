import Link from "next/link";
import { CardActions } from "./CardActions";
import { Filters } from "./Filters";
import { SortBar } from "./SortBar";
import { coverSrc, type NoteDir, type NoteSort } from "@/lib/notes";
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
                  <div className="card-cover">
                    <img
                      src={coverSrc(n.cover_url)}
                      alt=""
                      className={n.cover_url ? undefined : "is-fallback"}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
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
                <CardActions noteId={n.id} title={n.title} />
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
