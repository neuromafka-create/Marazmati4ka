"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { NoteFile } from "@/lib/notes";

type Role = "cover" | "result" | "reference" | "inline" | "attachment";

type LocalRef = { id: string; name: string; preview: string; file?: File; fileId?: number };

const MAX_REFS = 8;

function collectImageFiles(list: FileList | File[] | null) {
  if (!list) return [] as File[];
  return Array.from(list).filter(
    (f) => f.type.startsWith("image/") || /\.(png|jpe?g|gif|webp)$/i.test(f.name)
  );
}

export function IllustrateButton({
  noteId,
  defaultPrompt,
  defaultRole = "result",
  hasKey,
  gallery = [],
  onDone,
}: {
  noteId: number;
  defaultPrompt: string;
  defaultRole?: Role;
  hasKey: boolean;
  gallery?: NoteFile[];
  onDone?: (file: { id: number; url: string }, role: Role) => void;
}) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [role, setRole] = useState<Role>(defaultRole);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [refs, setRefs] = useState<LocalRef[]>([]);
  const [pickFromNote, setPickFromNote] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const refsRef = useRef(refs);
  refsRef.current = refs;

  useEffect(() => {
    return () => {
      refsRef.current.forEach((r) => {
        if (r.preview.startsWith("blob:")) URL.revokeObjectURL(r.preview);
      });
    };
  }, []);

  function addFiles(list: File[]) {
    if (!list.length) return;
    setErr("");
    setRefs((prev) => {
      const room = MAX_REFS - prev.length;
      if (room <= 0) return prev;
      const next = list.slice(0, room).map((file) => ({
        id: `f-${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
        name: file.name || "референс",
        preview: URL.createObjectURL(file),
        file,
      }));
      return [...prev, ...next];
    });
  }

  function addGallery(item: NoteFile) {
    setRefs((prev) => {
      if (prev.some((r) => r.fileId === item.file_id)) return prev;
      if (prev.length >= MAX_REFS) return prev;
      return [
        ...prev,
        {
          id: `g-${item.file_id}`,
          name: item.orig_name,
          preview: item.url,
          fileId: item.file_id,
        },
      ];
    });
  }

  function removeRef(id: string) {
    setRefs((prev) => {
      const gone = prev.find((r) => r.id === id);
      if (gone?.preview.startsWith("blob:")) URL.revokeObjectURL(gone.preview);
      return prev.filter((r) => r.id !== id);
    });
  }

  async function run() {
    setBusy(true);
    setErr("");
    const fd = new FormData();
    fd.set("prompt", prompt);
    fd.set("role", role);
    const ids = refs.map((r) => r.fileId).filter((n): n is number => typeof n === "number");
    if (ids.length) fd.set("refIds", ids.join(","));
    for (const r of refs) {
      if (r.file) fd.append("refs", r.file, r.name);
    }
    const res = await fetch(`/api/notes/${noteId}/illustrate`, { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setErr(data.error || "Не сгенерировалось");
      return;
    }
    onDone?.(data, role);
    setOpen(false);
  }

  if (!hasKey) {
    return (
      <Link className="btn ghost" href="/settings">
        Подключить нейросеть
      </Link>
    );
  }

  const unusedGallery = gallery.filter((f) => !refs.some((r) => r.fileId === f.file_id));

  return (
    <div
      className="illustrate"
      onPaste={(e) => {
        const files = collectImageFiles(e.clipboardData?.files || null);
        if (!files.length) return;
        e.preventDefault();
        e.stopPropagation();
        addFiles(files);
      }}
    >
      <button className="btn" type="button" onClick={() => setOpen((v) => !v)}>
        Нарисовать иллюстрацию
      </button>
      {open ? (
        <div className="illustrate-panel">
          <label>
            Что нарисовать
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={4} />
          </label>
          <div className="illustrate-refs">
            <div className="illustrate-refs-head">
              <span>Референсы</span>
              <div className="illustrate-refs-actions">
                {unusedGallery.length > 0 ? (
                  <button
                    type="button"
                    className={`btn ghost ${pickFromNote ? "on" : ""}`}
                    onClick={() => setPickFromNote((v) => !v)}
                  >
                    Из записи
                  </button>
                ) : null}
                <label className="btn ghost" style={{ textTransform: "none", letterSpacing: 0 }}>
                  Файл
                  <input
                    ref={inputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    hidden
                    onChange={(e) => {
                      addFiles(collectImageFiles(e.target.files));
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
            </div>
            <p className="hint">
              По умолчанию пусто: новая картинка рисуется с нуля. Референс (лицо, поза) добавляется только если выбрать файл, вставить Ctrl+V или нажать «Из записи».
            </p>
            {refs.length > 0 ? (
              <ul className="illustrate-thumbs">
                {refs.map((r) => (
                  <li key={r.id}>
                    <img src={r.preview} alt={r.name} />
                    <button type="button" className="gallery-x" title="Не использовать" onClick={() => removeRef(r.id)}>
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="hint illustrate-empty">Референсов нет.</p>
            )}
            {pickFromNote && unusedGallery.length > 0 ? (
              <div className="illustrate-from-note">
                <span className="hint">Нажмите картинку, чтобы добавить в референсы</span>
                <div className="illustrate-thumbs illustrate-thumbs-pick">
                  {unusedGallery.map((f) => (
                    <button key={f.file_id} type="button" title={f.orig_name} onClick={() => addGallery(f)}>
                      <img src={f.url} alt={f.orig_name} />
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
          <label>
            Прикрепить результат как
            <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
              <option value="cover">обложку</option>
              <option value="result">результат</option>
              <option value="reference">референс</option>
              <option value="attachment">файл</option>
            </select>
          </label>
          {err ? <p className="error">{err}</p> : null}
          <div className="actions" style={{ marginLeft: 0 }}>
            <button className="btn primary" type="button" disabled={busy || !prompt.trim()} onClick={() => void run()}>
              {busy ? "Рисую… это минута-две" : "Сгенерировать"}
            </button>
            <button className="btn ghost" type="button" onClick={() => setOpen(false)}>
              Скрыть
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function mergeGeneratedFile(list: NoteFile[], file: { id: number; url: string }, role: string): NoteFile[] {
  if (list.some((f) => f.file_id === file.id)) return list;
  return [
    ...list,
    {
      id: file.id,
      file_id: file.id,
      role,
      sort: list.length,
      orig_name: "illustration.png",
      mime: "image/png",
      url: file.url,
    },
  ];
}
