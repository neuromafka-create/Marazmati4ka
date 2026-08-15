"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Lightbox } from "./Lightbox";
import { Markdown } from "./Markdown";
import type { NoteFile } from "@/lib/notes";

export function NoteView({
  note,
  files,
  typeLabel,
  domainLabels,
}: {
  note: {
    id: number;
    title: string;
    type: string;
    domain: string;
    domains?: string[];
    body: string;
    source: string | null;
    prompt_extract: string | null;
  };
  files: NoteFile[];
  typeLabel: string;
  domainLabels: string[];
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState("");

  async function copyPrompt() {
    const text = note.prompt_extract || note.body;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  async function remove() {
    if (!confirm("Убрать заметку в корзину?")) return;
    const res = await fetch(`/api/notes/${note.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErr(data.error || "Не удалось удалить");
      return;
    }
    router.push("/");
    router.refresh();
  }

  const [items, setItems] = useState(files);
  const [lightbox, setLightbox] = useState<{ src: string; alt?: string } | null>(null);

  async function removeFile(fileId: number) {
    const res = await fetch(`/api/files/${fileId}?noteId=${note.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErr(data.error || "Не удалось убрать картинку");
      return;
    }
    setItems((prev) => prev.filter((f) => f.file_id !== fileId));
    router.refresh();
  }

  const visuals = items.filter((f) =>
    ["cover", "result", "reference", "inline", "attachment"].includes(f.role)
  );
  const roleLabel: Record<string, string> = {
    cover: "Обложка",
    result: "Результат",
    reference: "Референс",
    inline: "В тексте",
    attachment: "Файл",
  };

  return (
    <article className="note-page">
      <div className="crumbs">
        <Link href="/">Библиотека</Link>
        <span>/</span>
        <span>
          {typeLabel} · {domainLabels.join(" · ")}
        </span>
      </div>
      <div className="note-head">
        <div>
          <div className="card-tags">
            <span className="tag">{typeLabel}</span>
            {domainLabels.map((label) => (
              <span className="tag" key={label}>
                {label}
              </span>
            ))}
          </div>
          <h1>{note.title || "Без названия"}</h1>
        </div>
        <div className="actions" style={{ marginLeft: 0 }}>
          {(note.type === "prompt" || note.prompt_extract) && (
            <button className="btn primary" type="button" onClick={copyPrompt}>
              {copied ? "Скопировано" : "Скопировать промпт"}
            </button>
          )}
          <Link className="btn" href={`/n/${note.id}/edit`}>
            Править
          </Link>
          <button className="btn danger" type="button" onClick={remove}>
            Удалить
          </button>
        </div>
      </div>
      {note.source ? (
        <p className="crumbs">
          Источник:{" "}
          <a href={note.source} target="_blank" rel="noreferrer">
            {note.source}
          </a>
        </p>
      ) : null}
      {err ? <p className="error">{err}</p> : null}
      {visuals.length > 0 && (
        <div className="gallery">
          {visuals.map((f) => (
            <figure key={f.id}>
              <button
                type="button"
                className="gallery-x"
                title="Убрать картинку"
                onClick={() => void removeFile(f.file_id)}
              >
                ×
              </button>
              <button
                type="button"
                className="gallery-open"
                onClick={() => setLightbox({ src: f.url, alt: f.orig_name })}
              >
                <img src={f.url} alt={f.orig_name} />
              </button>
              <figcaption>{roleLabel[f.role] || f.role}</figcaption>
            </figure>
          ))}
        </div>
      )}
      <Markdown
        source={note.body}
        onOpenImage={(src, alt) => setLightbox({ src, alt })}
      />
      {lightbox ? (
        <Lightbox
          src={lightbox.src}
          alt={lightbox.alt}
          onClose={() => setLightbox(null)}
        />
      ) : null}
    </article>
  );
}
