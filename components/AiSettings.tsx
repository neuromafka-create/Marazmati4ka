"use client";

import { useEffect, useState } from "react";
import { CHAT_MODELS, IMAGE_MODELS } from "@/lib/hubris-models";

const HUBRIS_DEFAULT_BASE = "https://api.hubris.pw/v1";
const HUBRIS_DEFAULT_CHAT = "anthropic/claude-haiku-4.5";
const HUBRIS_DEFAULT_IMAGE = "google/gemini-2.5-flash-image";

type Public = {
  hasKey: boolean;
  keyPreview: string;
  baseUrl: string;
  chatModel: string;
  imageModel: string;
};

export function AiSettings({ initial }: { initial: Public }) {
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState(initial.baseUrl || HUBRIS_DEFAULT_BASE);
  const [chatModel, setChatModel] = useState(initial.chatModel || HUBRIS_DEFAULT_CHAT);
  const [imageModel, setImageModel] = useState(initial.imageModel || HUBRIS_DEFAULT_IMAGE);
  const [preview, setPreview] = useState(initial);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setPreview(initial);
    setBaseUrl(initial.baseUrl || HUBRIS_DEFAULT_BASE);
    setChatModel(initial.chatModel || HUBRIS_DEFAULT_CHAT);
    setImageModel(initial.imageModel || HUBRIS_DEFAULT_IMAGE);
  }, [initial]);

  async function save(extra: Record<string, unknown> = {}) {
    setBusy(true);
    setErr("");
    setOk("");
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey: apiKey.trim() || undefined,
        baseUrl,
        chatModel,
        imageModel,
        ...extra,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setErr(data.error || "Не сохранилось");
      return null;
    }
    setPreview(data);
    setApiKey("");
    return data as Public;
  }

  async function onSave() {
    const next = await save();
    if (next) setOk(next.hasKey ? "Сохранено. Ключ лежит в локальной базе, в интерфейс не возвращается." : "Сохранено.");
  }

  async function onTest() {
    const next = await save();
    if (!next) return;
    setBusy(true);
    setErr("");
    setOk("");
    const res = await fetch("/api/settings/test", { method: "POST" });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setErr(data.error || "Проверка не прошла");
      return;
    }
    setOk(`Связь есть: Hubris отдал ${data.models} моделей.`);
  }

  async function onClear() {
    if (!confirm("Удалить сохранённый ключ с этого компьютера?")) return;
    const next = await save({ clearKey: true });
    if (next) setOk("Ключ удалён.");
  }

  return (
    <section className="settings-block">
      <h2>Нейросеть</h2>
      <p className="settings-lead" style={{ marginBottom: 16 }}>
        Подключение через{" "}
        <a href="https://hubris.pw/docs/quickstart" target="_blank" rel="noreferrer">
          Hubris
        </a>
        : один OpenAI-совместимый URL и ключ. Нужно, например, чтобы нарисовать иллюстрацию к заметке.
      </p>
      <ol className="settings-steps">
        <li>
          <a href="https://hubris.pw/sign-in" target="_blank" rel="noreferrer">
            Регистрация
          </a>{" "}
          по email
        </li>
        <li>
          Создать ключ в{" "}
          <a href="https://hubris.pw/keys" target="_blank" rel="noreferrer">
            API-ключи
          </a>{" "}
          — показывается один раз, формат <code>sk-gw-…</code>
        </li>
        <li>
          Пополнить баланс в{" "}
          <a href="https://hubris.pw/billing" target="_blank" rel="noreferrer">
            Биллинге
          </a>{" "}
          (от 300 ₽ через СБП)
        </li>
      </ol>
      <div className="form settings-form">
        <label>
          API-ключ
          <input
            type="password"
            autoComplete="off"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={preview.hasKey ? preview.keyPreview : "sk-gw-…"}
          />
        </label>
        <label>
          Базовый URL
          <input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder={HUBRIS_DEFAULT_BASE} />
        </label>
        <div className="row-2">
          <label>
            Модель для текста
            <select value={chatModel} onChange={(e) => setChatModel(e.target.value)}>
              {CHAT_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
              {!CHAT_MODELS.some((m) => m.id === chatModel) && chatModel ? (
                <option value={chatModel}>{chatModel}</option>
              ) : null}
            </select>
          </label>
          <label>
            Модель для иллюстраций
            <select value={imageModel} onChange={(e) => setImageModel(e.target.value)}>
              {IMAGE_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
              {!IMAGE_MODELS.some((m) => m.id === imageModel) && imageModel ? (
                <option value={imageModel}>{imageModel}</option>
              ) : null}
            </select>
          </label>
        </div>
        <p className="hint">
          {preview.hasKey
            ? `Ключ сохранён: ${preview.keyPreview}. Пустое поле при сохранении его не затирает.`
            : "Ключ хранится только в локальной SQLite (`data/notebook.db`), в git не попадает."}
        </p>
        {err ? <p className="error">{err}</p> : null}
        {ok ? <p className="hint">{ok}</p> : null}
        <div className="actions" style={{ marginLeft: 0 }}>
          <button className="btn primary" type="button" disabled={busy} onClick={() => void onSave()}>
            {busy ? "…" : "Сохранить"}
          </button>
          <button className="btn" type="button" disabled={busy} onClick={() => void onTest()}>
            Проверить связь
          </button>
          {preview.hasKey ? (
            <button className="btn ghost" type="button" disabled={busy} onClick={() => void onClear()}>
              Удалить ключ
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
