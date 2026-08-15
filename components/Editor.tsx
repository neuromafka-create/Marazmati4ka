"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Taxon } from "@/lib/taxonomy";
import type { NoteFile } from "@/lib/notes";

type Role = "cover" | "result" | "reference" | "inline" | "attachment";

function collectClipboardImages(e: ClipboardEvent) {
  const images: File[] = [];
  const seen = new Set<string>();
  const add = (f: File | null) => {
    if (!f) return;
    const looksImage =
      f.type.startsWith("image/") ||
      !f.type ||
      /\.(png|jpe?g|gif|webp)$/i.test(f.name);
    if (!looksImage) return;
    const key = `${f.name}:${f.size}:${f.lastModified}`;
    if (seen.has(key)) return;
    seen.add(key);
    images.push(f);
  };
  if (e.clipboardData?.items) {
    for (const item of e.clipboardData.items) {
      if (item.kind === "file") add(item.getAsFile());
    }
  }
  if (e.clipboardData?.files) {
    for (const f of Array.from(e.clipboardData.files)) add(f);
  }
  return images;
}

export function Editor({
  noteId,
  initial,
  files: initialFiles,
  types,
  domains,
}: {
  noteId: number;
  initial: {
    title: string;
    type: string;
    domain: string;
    domains?: string[];
    body: string;
    source: string | null;
    draft: number;
  };
  files: NoteFile[];
  types: Taxon[];
  domains: Taxon[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title);
  const [type, setType] = useState(initial.type);
  const [selectedDomains, setSelectedDomains] = useState<string[]>(
    initial.domains?.length ? initial.domains : initial.domain ? [initial.domain] : []
  );
  const [source, setSource] = useState(initial.source || "");
  const [body, setBody] = useState(initial.body);
  const [files, setFiles] = useState(initialFiles);
  const [role, setRole] = useState<Role>(
    (initial.domains || [initial.domain]).includes("image") ? "result" : "attachment"
  );
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const hoverRole = useRef<Role | null>(null);

  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const images = collectClipboardImages(e);
      if (!images.length) return;
      e.preventDefault();
      const inText = document.activeElement === textRef.current;
      const nextRole: Role =
        hoverRole.current ||
        (inText ? "inline" : selectedDomains.includes("image") ? "result" : "attachment");
      void uploadMany(images, nextRole, true);
    }
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [selectedDomains, noteId, body]);

  async function reloadFiles() {
    const res = await fetch(`/api/notes/${noteId}`);
    const data = await res.json();
    if (data.files) setFiles(data.files);
  }

  async function uploadMany(list: File[], nextRole: Role, insertInline: boolean) {
    setErr("");
    for (const file of list) {
      const fd = new FormData();
      fd.set("noteId", String(noteId));
      fd.set("role", nextRole);
      fd.set("file", file);
      const res = await fetch("/api/files", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "Не удалось загрузить");
        return;
      }
      if (insertInline && data.id) {
        const tag = `![](/media/${data.id})`;
        const el = textRef.current;
        if (el) {
          const start = el.selectionStart;
          const end = el.selectionEnd;
          const next = body.slice(0, start) + tag + body.slice(end);
          setBody(next);
        } else {
          setBody((b) => `${b}\n${tag}\n`);
        }
      }
    }
    await reloadFiles();
  }

  async function removeFile(fileId: number) {
    setErr("");
    const res = await fetch(`/api/files/${fileId}?noteId=${noteId}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(data.error || "Не удалось убрать картинку");
      return;
    }
    setFiles((prev) => prev.filter((f) => f.file_id !== fileId));
    setBody((b) =>
      b
        .replace(new RegExp(`!\\[[^\\]]*\\]\\(/media/${fileId}\\)`, "g"), "")
        .replace(/\n{3,}/g, "\n\n")
    );
  }

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const list = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = "";
    if (list.length) await uploadMany(list, role, false);
  }

  async function save() {
    setBusy(true);
    setErr("");
    const res = await fetch(`/api/notes/${noteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, type, domains: selectedDomains, body, source }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setErr(data.error || "Не сохранилось");
      return;
    }
    router.push(`/n/${noteId}`);
    router.refresh();
  }

  async function cancel() {
    if (initial.draft) {
      await fetch(`/api/notes/${noteId}`, { method: "DELETE" });
    }
    router.push(initial.draft ? "/" : `/n/${noteId}`);
    router.refresh();
  }

  const roleLabel: Record<string, string> = {
    cover: "Обложка",
    result: "Результат",
    reference: "Референс",
    inline: "В тексте",
    attachment: "Файл",
  };

  return (
    <div className="editor-page">
      <div className="crumbs">
        <Link href="/">Библиотека</Link>
        <span>/</span>
        <span>{initial.draft ? "Новая заметка" : "Правка"}</span>
      </div>
      <div className="form">
        <label>
          Заголовок
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Как назвать" />
        </label>
        <div className="row-2">
          <label>
            Тип
            <select value={type} onChange={(e) => setType(e.target.value)}>
              {types.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Области
            <div className="chip-list">
              {domains.map((d) => {
                const on = selectedDomains.includes(d.slug);
                return (
                  <button
                    key={d.slug}
                    type="button"
                    className={`chip ${on ? "on" : ""}`}
                    onClick={() => {
                      setSelectedDomains((prev) => {
                        if (on) {
                          if (prev.length === 1) return prev;
                          return prev.filter((x) => x !== d.slug);
                        }
                        const next = [...prev, d.slug];
                        if (d.slug === "image" && role === "attachment") setRole("result");
                        return next;
                      });
                    }}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </label>
        </div>
        <label>
          Источник
          <input value={source} onChange={(e) => setSource(e.target.value)} placeholder="https://…" />
        </label>

        <div
          className="upload-bar"
          onMouseEnter={() => {
            hoverRole.current = role;
          }}
          onMouseLeave={() => {
            hoverRole.current = null;
          }}
        >
          <label style={{ textTransform: "none", letterSpacing: 0 }}>
            Прикрепить как
            <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
              <option value="cover">обложку</option>
              <option value="result">результат</option>
              <option value="reference">референс</option>
              <option value="attachment">файл</option>
            </select>
          </label>
          <label className="btn" style={{ textTransform: "none", letterSpacing: 0 }}>
            Выбрать файл
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple hidden onChange={onPick} />
          </label>
          <span className="hint">или Ctrl+V — скриншот и картинка из буфера</span>
        </div>

        {files.length > 0 && (
          <div className="gallery">
            {files.map((f) => (
              <figure key={f.id}>
                <button
                  type="button"
                  className="gallery-x"
                  title="Убрать картинку"
                  onClick={() => void removeFile(f.file_id)}
                >
                  ×
                </button>
                <img src={f.url} alt={f.orig_name} />
                <figcaption>{roleLabel[f.role] || f.role}</figcaption>
              </figure>
            ))}
          </div>
        )}

        <label>
          Текст
          <textarea
            ref={textRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Markdown, промпт, инструкция…"
          />
        </label>
        {err ? <p className="error">{err}</p> : null}
        <div className="actions" style={{ marginLeft: 0 }}>
          <button className="btn primary" type="button" disabled={busy} onClick={save}>
            {busy ? "Сохраняю…" : "Сохранить"}
          </button>
          <button className="btn ghost" type="button" onClick={cancel}>
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}
