"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { NoteOpenLink } from "./NoteOpenLink";

export function CardActions({ noteId, title }: { noteId: number; title: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const name = title.trim() || "эту запись";
    if (!confirm(`Убрать «${name}» в корзину?`)) return;
    setBusy(true);
    const res = await fetch(`/api/notes/${noteId}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Не удалось удалить");
      return;
    }
    router.refresh();
  }

  return (
    <div className="card-actions">
      <NoteOpenLink noteId={noteId} href={`/n/${noteId}/edit`} className="card-icon" title="Править" aria-label="Править">
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path
            fill="currentColor"
            d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm17.71-10.04a1 1 0 0 0 0-1.41l-2.51-2.51a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 2-1.66z"
          />
        </svg>
      </NoteOpenLink>
      <button
        type="button"
        className="card-icon card-icon-danger"
        title="Удалить"
        aria-label="Удалить"
        disabled={busy}
        onClick={remove}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path
            fill="currentColor"
            d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
          />
        </svg>
      </button>
    </div>
  );
}
