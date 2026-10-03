"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { libraryReturnHref } from "@/lib/library-return";
import { LibraryLink } from "./LibraryLink";
import { IllustrateButton, mergeGeneratedFile } from "./IllustrateButton";
import { Lightbox } from "./Lightbox";
import { Markdown } from "./Markdown";
import { isDocFile, isVideoFile, NoteMedia } from "./NoteMedia";
import type { NoteFile } from "@/lib/notes";

export function NoteView({
  note,
  files,
  typeLabel,
  domainLabels,
  hasAiKey,
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
  hasAiKey: boolean;
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
    router.push(libraryReturnHref());
    router.refresh();
  }

  const [items, setItems] = useState(files);
  const [lightbox, setLightbox] = useState<{ i: number; extra?: { src: string; alt?: string } } | null>(null);

  async function removeFile(fileId: number) {
    const res = await fetch(`/api/files/${fileId}?noteId=${note.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErr(data.error || "Не удалось убрать файл");
      return;
    }
    setItems((prev) => prev.filter((f) => f.file_id !== fileId));
    router.refresh();
  }

  const docs = items.filter((f) => isDocFile(f.mime));
  const visuals = items.filter(
    (f) =>
      !isDocFile(f.mime) && ["cover", "result", "reference", "inline", "attachment"].includes(f.role)
  );
  const pictures = visuals.filter((f) => !isVideoFile(f.mime));
  const slides: { src: string; alt?: string }[] = pictures.map((f) => ({ src: f.url, alt: f.orig_name }));
  if (lightbox?.extra && !slides.some((s) => s.src === lightbox.extra!.src)) {
    slides.push(lightbox.extra);
  }
  const safeIndex = lightbox ? Math.min(lightbox.i, Math.max(0, slides.length - 1)) : 0;
  const current = lightbox && slides.length ? slides[safeIndex] : null;

  function openImage(src: string, alt?: string) {
    const base = pictures.map((f) => ({ src: f.url, alt: f.orig_name }));
    const found = base.findIndex((s) => s.src === src);
    if (found >= 0) setLightbox({ i: found });
    else setLightbox({ i: base.length, extra: { src, alt } });
  }

  function step(delta: number) {
    setLightbox((cur) => {
      if (!cur) return cur;
      const n = slides.length;
      if (n < 2) return cur;
      return { ...cur, i: (cur.i + delta + n) % n };
    });
  }
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
        <LibraryLink>Библиотека</LibraryLink>
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
      <IllustrateButton
        noteId={note.id}
        hasKey={hasAiKey}
        gallery={visuals}
        defaultPrompt={[note.title, note.prompt_extract || note.body.slice(0, 400)].filter(Boolean).join("\n\n")}
        defaultRole={visuals.length ? "result" : "cover"}
        onDone={(file, nextRole) => {
          setItems((prev) => mergeGeneratedFile(prev, file, nextRole));
          router.refresh();
        }}
      />
      {err ? <p className="error">{err}</p> : null}
      {visuals.length > 0 && (
        <div className="gallery">
          {visuals.map((f) => {
            const video = isVideoFile(f.mime);
            return (
              <figure key={f.id} className={video ? "is-video" : undefined}>
                <button
                  type="button"
                  className="gallery-x"
                  title={video ? "Убрать видео" : "Убрать картинку"}
                  onClick={() => void removeFile(f.file_id)}
                >
                  ×
                </button>
                {video ? (
                  <NoteMedia mime={f.mime} url={f.url} name={f.orig_name} />
                ) : (
                  <button
                    type="button"
                    className="gallery-open"
                    onClick={() => openImage(f.url, f.orig_name)}
                  >
                    <img src={f.url} alt={f.orig_name} />
                  </button>
                )}
                <figcaption>{roleLabel[f.role] || f.role}</figcaption>
              </figure>
            );
          })}
        </div>
      )}
      <Markdown
        source={note.body}
        onOpenImage={(src, alt) => openImage(src, alt)}
      />
      {docs.length > 0 ? (
        <div className="attach-docs">
          <span className="fmt-heading">Файлы</span>
          <ul className="file-list">
            {docs.map((f) => (
              <li key={f.id} className="file-row">
                <a href={f.url} target="_blank" rel="noreferrer">
                  {f.orig_name || "файл.pdf"}
                </a>
                <button type="button" className="btn ghost" onClick={() => void removeFile(f.file_id)}>
                  Убрать
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {current ? (
        <Lightbox
          src={current.src}
          alt={current.alt}
          index={safeIndex}
          total={slides.length}
          onClose={() => setLightbox(null)}
          onPrev={slides.length > 1 ? () => step(-1) : undefined}
          onNext={slides.length > 1 ? () => step(1) : undefined}
        />
      ) : null}
    </article>
  );
}
