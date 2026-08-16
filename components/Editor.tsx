"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Taxon } from "@/lib/taxonomy";
import type { NoteFile } from "@/lib/notes";
import type { Edit } from "@/lib/md-format";
import { wrapInline } from "@/lib/md-format";
import { EditorToolbar, type EditorToolbarHandle } from "./EditorToolbar";
import { IllustrateButton } from "./IllustrateButton";
import { Markdown } from "./Markdown";

type Role = "cover" | "result" | "reference" | "inline" | "attachment";

function collectClipboardImages(e: ClipboardEvent) {
  const images: File[] = [];
  const seen = new Set<string>();
  const add = (f: File | null) => {
    if (!f) return;
    const looksImage =
      f.type.startsWith("image/") ||
      !f.type ||
      /\.(png|jpe?g|gif|webp|bmp)$/i.test(f.name);
    if (!looksImage) return;
    const key = `${f.type}:${f.size}:${f.name || "image"}`;
    if (seen.has(key)) return;
    seen.add(key);
    images.push(f);
  };

  const items = e.clipboardData?.items;
  if (items?.length) {
    for (const item of items) {
      if (item.kind === "file") add(item.getAsFile());
    }
  }
  if (!images.length && e.clipboardData?.files) {
    for (const f of Array.from(e.clipboardData.files)) add(f);
  }

  if (images.length <= 1) return images;

  const fromExplorer = images.filter(
    (f) => f.name && !/^image\.(png|jpe?g|gif|bmp|webp)$/i.test(f.name)
  );
  if (fromExplorer.length) return images;

  const rank = (type: string) => {
    if (type === "image/png") return 0;
    if (type === "image/webp") return 1;
    if (type === "image/jpeg" || type === "image/jpg") return 2;
    if (type === "image/gif") return 3;
    return 9;
  };
  return [images.slice().sort((a, b) => rank(a.type) - rank(b.type) || b.size - a.size)[0]];
}

export function Editor({
  noteId,
  initial,
  files: initialFiles,
  types,
  domains,
  hasAiKey,
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
  hasAiKey: boolean;
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
  const [pane, setPane] = useState<"write" | "preview">("write");
  const textRef = useRef<HTMLTextAreaElement>(null);
  const toolbarRef = useRef<EditorToolbarHandle>(null);
  const hoverRole = useRef<Role | null>(null);
  const pasting = useRef(false);

  function applyEdit(next: Edit) {
    setBody(next.text);
    requestAnimationFrame(() => {
      const el = textRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(next.start, next.end);
    });
  }

  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const images = collectClipboardImages(e);
      if (!images.length) return;
      if (pasting.current) {
        e.preventDefault();
        return;
      }
      e.preventDefault();
      const inText = document.activeElement === textRef.current;
      const nextRole: Role =
        hoverRole.current ||
        (inText ? "inline" : selectedDomains.includes("image") ? "result" : "attachment");
      void uploadMany(images, nextRole, inText);
    }
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [selectedDomains, noteId]);

  async function reloadFiles() {
    const res = await fetch(`/api/notes/${noteId}`);
    const data = await res.json();
    if (data.files) setFiles(data.files);
  }

  async function uploadMany(list: File[], nextRole: Role, insertInline: boolean) {
    if (pasting.current) return;
    pasting.current = true;
    setErr("");
    try {
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
          setBody((b) => {
            const el = textRef.current;
            if (!el) return `${b}\n${tag}\n`;
            const start = el.selectionStart;
            const end = el.selectionEnd;
            return b.slice(0, start) + tag + b.slice(end);
          });
        }
      }
      await reloadFiles();
    } finally {
      pasting.current = false;
    }
  }

  async function changeRole(fileId: number, nextRole: Role) {
    setErr("");
    const prev = files;
    setFiles((list) => list.map((f) => (f.file_id === fileId ? { ...f, role: nextRole } : f)));
    const res = await fetch(`/api/files/${fileId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ noteId, role: nextRole }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setFiles(prev);
      setErr(data.error || "Не удалось сменить роль");
      return;
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
        <IllustrateButton
          noteId={noteId}
          hasKey={hasAiKey}
          gallery={files}
          defaultPrompt={[title, body.slice(0, 400)].filter(Boolean).join("\n\n")}
          defaultRole={role === "attachment" ? "result" : role}
          onDone={() => void reloadFiles()}
        />

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
                <figcaption>
                  <label className="gallery-role">
                    <span className="sr-only">Роль картинки</span>
                    <select
                      value={f.role}
                      onChange={(e) => void changeRole(f.file_id, e.target.value as Role)}
                    >
                      <option value="cover">Обложка</option>
                      <option value="result">Результат</option>
                      <option value="reference">Референс</option>
                      <option value="attachment">Файл</option>
                      <option value="inline">В тексте</option>
                    </select>
                  </label>
                </figcaption>
              </figure>
            ))}
          </div>
        )}

        <div className="editor-text">
          <div className="editor-text-head">
            <span className="fmt-heading">Текст</span>
            <div className="pane-tabs">
              <button type="button" className={`pane-tab ${pane === "write" ? "on" : ""}`} onClick={() => setPane("write")}>
                Разметка
              </button>
              <button type="button" className={`pane-tab ${pane === "preview" ? "on" : ""}`} onClick={() => setPane("preview")}>
                Как будет
              </button>
            </div>
          </div>
          <EditorToolbar ref={toolbarRef} value={body} textareaRef={textRef} onApply={applyEdit} />
          <textarea
            ref={textRef}
            className={pane === "preview" ? "is-hidden" : undefined}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
              const el = textRef.current;
              if (!el) return;
              const from = el.selectionStart;
              const to = el.selectionEnd;
              const key = e.key.toLowerCase();
              if (key === "b") {
                e.preventDefault();
                applyEdit(wrapInline(body, from, to, "**"));
              } else if (key === "i") {
                e.preventDefault();
                applyEdit(wrapInline(body, from, to, "*"));
              } else if (key === "k") {
                e.preventDefault();
                toolbarRef.current?.startLink();
              }
            }}
            placeholder="Markdown, промпт, инструкция…"
          />
          {pane === "preview" ? (
            <div className="editor-preview">
              {body.trim() ? <Markdown source={body} /> : <p className="hint">Пока пусто — переключитесь на «Разметка».</p>}
            </div>
          ) : null}
        </div>
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
