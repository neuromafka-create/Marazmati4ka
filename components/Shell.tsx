"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { libraryUrl } from "@/lib/library-url";
import { readLibrarySpot, saveLibrarySpot } from "@/lib/library-return";
import { LibraryLink } from "./LibraryLink";

export function Shell(props: {
  children: React.ReactNode;
  initialQuery?: string;
  brand?: { name: string; tag: string; search: string };
}) {
  return (
    <Suspense>
      <ShellInner {...props} />
    </Suspense>
  );
}

function ShellInner({
  children,
  initialQuery = "",
  brand = { name: "Marazmati4ka", tag: "блокнот", search: "Найти промпт, гайд, термин…" },
}: {
  children: React.ReactNode;
  initialQuery?: string;
  brand?: { name: string; tag: string; search: string };
}) {
  const router = useRouter();
  const params = useSearchParams();
  const path = usePathname();
  const [q, setQ] = useState(initialQuery);

  return (
    <div className="app">
      <header className="topbar">
        <LibraryLink className="brand">
          <strong>{brand.name}</strong>
          <span>{brand.tag}</span>
        </LibraryLink>
        <form
          className="search"
          onSubmit={(e) => {
            e.preventDefault();
            const next = q.trim();
            const fromShelf = path === "/" ? null : readLibrarySpot();
            const shelf = fromShelf ? new URL(fromShelf.href, "http://local") : null;
            router.push(
              libraryUrl({
                q: next,
                types: shelf ? shelf.searchParams.getAll("type") : params.getAll("type"),
                domains: shelf ? shelf.searchParams.getAll("domain") : params.getAll("domain"),
                sort: (shelf ? shelf.searchParams.get("sort") : params.get("sort")) || undefined,
                dir: (shelf ? shelf.searchParams.get("dir") : params.get("dir")) || undefined,
              })
            );
          }}
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={brand.search}
          />
        </form>
        <div className="actions">
          <Link className="btn ghost" href="/settings">
            Настройки
          </Link>
          <ThemeToggle />
          <Link className="btn primary" href="/new" onClick={() => saveLibrarySpot()}>
            Новая
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
