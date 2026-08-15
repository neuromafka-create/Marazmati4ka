"use client";

import { useRouter } from "next/navigation";
import { libraryUrl } from "@/lib/library-url";
import type { NoteDir, NoteSort } from "@/lib/notes";

export function SortBar({
  query,
  selectedTypes,
  selectedDomains,
  sort,
  dir,
}: {
  query: string;
  selectedTypes: string[];
  selectedDomains: string[];
  sort: NoteSort;
  dir: NoteDir;
}) {
  const router = useRouter();

  function go(next: { sort?: NoteSort; dir?: NoteDir }) {
    router.push(
      libraryUrl({
        q: query,
        types: selectedTypes,
        domains: selectedDomains,
        sort: next.sort ?? sort,
        dir: next.dir ?? dir,
      })
    );
  }

  return (
    <div className="sort-bar">
      <label>
        Сортировка
        <select
          value={sort}
          onChange={(e) => {
            const next = e.target.value as NoteSort;
            go({ sort: next, dir: next === "title" ? "asc" : "desc" });
          }}
        >
          <option value="title">по алфавиту</option>
          <option value="created">по дате создания</option>
          <option value="updated">по дате изменения</option>
        </select>
      </label>
      <label>
        Порядок
        <select value={dir} onChange={(e) => go({ dir: e.target.value as NoteDir })}>
          <option value="asc">{sort === "title" ? "А → Я" : "сначала старые"}</option>
          <option value="desc">{sort === "title" ? "Я → А" : "сначала новые"}</option>
        </select>
      </label>
    </div>
  );
}
