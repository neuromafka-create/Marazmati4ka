"use client";

import { useEffect, useState } from "react";
import { CHAT_MODELS, IMAGE_MODELS } from "@/lib/hubris-models";

const HUBRIS_DEFAULT_BASE = "https://api.hubris.pw/v1";
const HUBRIS_DEFAULT_CHAT = "anthropic/claude-haiku-4.5";
const HUBRIS_DEFAULT_IMAGE = "google/gemini-2.5-flash-image";
const HUBRIS_REF = "https://hubris.pw/r/25714440";
const HUBRIS_REF_CODE = "25714440";

function splitModel(value: string, presets: { id: string }[], fallback: string) {
  const known = presets.some((m) => m.id === value);
  return { selected: known ? value : fallback, custom: known ? "" : value };
}

function pickModel(custom: string, selected: string) {
  return custom.trim() || selected;
}

type Public = {
  hasKey: boolean;
  keyPreview: string;
  baseUrl: string;
  chatModel: string;
  imageModel: string;
};

export function AiSettings({ initial }: { initial: Public }) {
  const chatInit = splitModel(initial.chatModel || HUBRIS_DEFAULT_CHAT, CHAT_MODELS, HUBRIS_DEFAULT_CHAT);
  const imageInit = splitModel(initial.imageModel || HUBRIS_DEFAULT_IMAGE, IMAGE_MODELS, HUBRIS_DEFAULT_IMAGE);
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState(initial.baseUrl || HUBRIS_DEFAULT_BASE);
  const [chatModel, setChatModel] = useState(chatInit.selected);
  const [imageModel, setImageModel] = useState(imageInit.selected);
  const [customChatModel, setCustomChatModel] = useState(chatInit.custom);
  const [customImageModel, setCustomImageModel] = useState(imageInit.custom);
  const [preview, setPreview] = useState(initial);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const nextChat = splitModel(initial.chatModel || HUBRIS_DEFAULT_CHAT, CHAT_MODELS, HUBRIS_DEFAULT_CHAT);
    const nextImage = splitModel(initial.imageModel || HUBRIS_DEFAULT_IMAGE, IMAGE_MODELS, HUBRIS_DEFAULT_IMAGE);
    setPreview(initial);
    setBaseUrl(initial.baseUrl || HUBRIS_DEFAULT_BASE);
    setChatModel(nextChat.selected);
    setImageModel(nextImage.selected);
    setCustomChatModel(nextChat.custom);
    setCustomImageModel(nextImage.custom);
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
        chatModel: pickModel(customChatModel, chatModel),
        imageModel: pickModel(customImageModel, imageModel),
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
        <a href={HUBRIS_REF} target="_blank" rel="noreferrer">
          Hubris
        </a>
        : один OpenAI-совместимый URL и ключ. Нужно, например, чтобы нарисовать иллюстрацию к заметке.
      </p>
      <ol className="settings-steps">
        <li>
          <a href={HUBRIS_REF} target="_blank" rel="noreferrer">
            Регистрация
          </a>{" "}
          по email. Код для ввода вручную: <code>{HUBRIS_REF_CODE}</code>
        </li>
        <li>
          Создать ключ в{" "}
          <a href={HUBRIS_REF} target="_blank" rel="noreferrer">
            API-ключи
          </a>{" "}
          — показывается один раз, формат <code>sk-gw-…</code>
        </li>
        <li>
          Пополнить баланс в{" "}
          <a href={HUBRIS_REF} target="_blank" rel="noreferrer">
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
          <div className="model-field">
            <label>
              Модель для текста
              <select value={chatModel} onChange={(e) => setChatModel(e.target.value)}>
                {CHAT_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Своя модель
              <input
                value={customChatModel}
                onChange={(e) => setCustomChatModel(e.target.value)}
                placeholder="provider/model"
                spellCheck={false}
                autoComplete="off"
              />
            </label>
          </div>
          <div className="model-field">
            <label>
              Модель для иллюстраций
              <select value={imageModel} onChange={(e) => setImageModel(e.target.value)}>
                {IMAGE_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Своя модель
              <input
                value={customImageModel}
                onChange={(e) => setCustomImageModel(e.target.value)}
                placeholder="provider/model"
                spellCheck={false}
                autoComplete="off"
              />
            </label>
          </div>
        </div>
        <p className="hint">Непустое поле своей модели важнее списка.</p>
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
