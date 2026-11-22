"use client";

import { useState } from "react";
import { QUOTE_STYLES, type QuoteStyleId } from "@/lib/quote-style";

export function QuoteSettings({ initial }: { initial: { quoteStyle: QuoteStyleId } }) {
  const [id, setId] = useState(initial.quoteStyle);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);

  async function pick(next: QuoteStyleId) {
    setBusy(true);
    setErr("");
    setOk("");
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quoteStyle: next }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setErr(data.error || "Не сохранилось");
      return;
    }
    const chosen = (data.quoteStyle as QuoteStyleId) || next;
    setId(chosen);
    document.documentElement.setAttribute("data-quote", chosen);
    setOk("Сохранено. Так цитаты выглядят в заметках.");
  }

  return (
    <section className="settings-block">
      <h2>Цитаты</h2>
      <p className="settings-lead" style={{ marginBottom: 16 }}>
        Фон и полоска слева у блоков «цитата» в просмотре и в превью правки.
      </p>
      <div className="quote-picks">
        {QUOTE_STYLES.map((s) => (
          <button
            key={s.id}
            type="button"
            data-quote={s.id}
            className={`quote-pick${id === s.id ? " is-on" : ""}`}
            disabled={busy}
            onClick={() => void pick(s.id)}
          >
            <blockquote>Короткий пример цитаты в этом цвете.</blockquote>
            <span>{s.label}</span>
          </button>
        ))}
      </div>
      <p className="hint">Выбор сразу сохраняется.</p>
      {err ? <p className="error">{err}</p> : null}
      {ok ? <p className="hint">{ok}</p> : null}
    </section>
  );
}
