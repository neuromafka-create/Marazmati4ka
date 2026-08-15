"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { libraryUrl } from "@/lib/library-url";

export function Shell(props: { children: React.ReactNode; initialQuery?: string }) {
  return (
    <Suspense>
      <ShellInner {...props} />
    </Suspense>
  );
}

function ShellInner({
  children,
  initialQuery = "",
}: {
  children: React.ReactNode;
  initialQuery?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(initialQuery);

  return (
    <div className="app">
      <header className="topbar">
        <Link href="/" className="brand">
          <strong>Marazmati4ka</strong>
          <span>блокнот</span>
        </Link>
        <form
          className="search"
          onSubmit={(e) => {
            e.preventDefault();
            const next = q.trim();
            router.push(
              libraryUrl({
                q: next,
                types: params.getAll("type"),
                domains: params.getAll("domain"),
                sort: params.get("sort") || undefined,
                dir: params.get("dir") || undefined,
              })
            );
          }}
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Найти промпт, гайд, термин…"
          />
        </form>
        <div className="actions">
          <Link className="btn ghost" href="/settings">
            Справочники
          </Link>
          <ThemeToggle />
          <Link className="btn primary" href="/new">
            Новая
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
