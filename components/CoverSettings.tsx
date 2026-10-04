"use client";

import { useRef, useState } from "react";
import { PLACEHOLDER_PRESETS, type PlaceholderCoverId } from "@/lib/placeholder-cover";

type PublicCover = {
  placeholderCover: PlaceholderCoverId;
  placeholderCoverUrl: string;
  hasCustomCover: boolean;
  customCoverUrl: string | null;
};

export function CoverSettings({ initial }: { initial: PublicCover }) {
  const [preview, setPreview] = useState(initial);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function apply(next: PublicCover, message: string) {
    setPreview(next);
    setOk(message);
  }

  async function pick(id: PlaceholderCoverId) {
    if (id === "custom" && !preview.hasCustomCover) {
      fileRef.current?.click();
      return;
    }
    setBusy(true);
    setErr("");
    setOk("");
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placeholderCover: id }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setErr(data.error || "Не сохранилось");
      return;
    }
    await apply(data, "Сохранено. Карточки без своей обложки возьмут эту картинку.");
  }

  async function onUpload(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setErr("");
    setOk("");
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/settings/cover", { method: "POST", body: form });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setErr(data.error || "Не загрузилось");
      return;
    }
    await apply(data, "Своя картинка сохранена и выбрана.");
  }

  async function onClearCustom() {
    if (!confirm("Убрать загруженную картинку? Вернётся записная книжка, если сейчас выбрана своя.")) return;
    setBusy(true);
    setErr("");
    setOk("");
    const res = await fetch("/api/settings/cover", { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setErr(data.error || "Не удалось убрать");
      return;
    }
    await apply(data, "Своя картинка удалена.");
  }

  return (
    <section className="settings-block">
      <h2>Картинка по умолчанию</h2>
      <p className="settings-lead" style={{ marginBottom: 16 }}>
        Для карточек, у которых нет своей обложки. Пять тем, записная книжка как сейчас, или файл с компьютера.
      </p>
      <div className="cover-picks">
        {PLACEHOLDER_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`cover-pick${preview.placeholderCover === p.id ? " is-on" : ""}`}
            disabled={busy}
            onClick={() => void pick(p.id)}
          >
            <img src={p.src} alt="" />
            <span>{p.label}</span>
          </button>
        ))}
        <button
          type="button"
          className={`cover-pick${preview.placeholderCover === "custom" ? " is-on" : ""}`}
          disabled={busy}
          onClick={() => void pick("custom")}
        >
          {preview.customCoverUrl ? (
            <img src={preview.customCoverUrl} alt="" />
          ) : (
            <div className="cover-pick-empty">файл</div>
          )}
          <span>Своя картинка</span>
        </button>
      </div>
      <div className="cover-pick-actions">
        <label className="btn" style={{ textTransform: "none", letterSpacing: 0 }}>
          Загрузить файл
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              void onUpload(file);
            }}
          />
        </label>
        {preview.hasCustomCover ? (
          <button className="btn ghost" type="button" disabled={busy} onClick={() => void onClearCustom()}>
            Убрать свою
          </button>
        ) : null}
        <span className="hint">jpeg, png, webp или gif, до 15 МБ. Выбор сразу сохраняется.</span>
      </div>
      {err ? <p className="error">{err}</p> : null}
      {ok ? <p className="hint">{ok}</p> : null}
    </section>
  );
}
