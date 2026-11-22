"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Taxon, TaxonKind } from "@/lib/taxonomy";

function Section({
  kind,
  title,
  items,
}: {
  kind: TaxonKind;
  title: string;
  items: Taxon[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState(items);
  const [label, setLabel] = useState("");
  const [slug, setSlug] = useState("");
  const [err, setErr] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const moving = useRef(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editSlug, setEditSlug] = useState("");

  useEffect(() => {
    setRows(items);
  }, [items]);

  const others = useMemo(() => rows.filter((t) => t.id !== editId), [rows, editId]);

  async function move(item: Taxon, direction: "up" | "down") {
    const index = rows.findIndex((t) => t.id === item.id);
    const next = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || next < 0 || next >= rows.length || moving.current) return;
    moving.current = true;
    const previous = rows;
    const order = rows.slice();
    const [row] = order.splice(index, 1);
    order.splice(next, 0, row);
    setRows(order);
    setErr("");
    setBusyId(item.id);
    try {
      const res = await fetch(`/api/taxons/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ move: direction }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRows(previous);
        setErr(data.error || "Не переставилось");
        return;
      }
      if (Array.isArray(data.items)) setRows(data.items);
      router.refresh();
    } catch {
      setRows(previous);
      setErr("Не переставилось");
    } finally {
      moving.current = false;
      setBusyId(null);
    }
  }

  async function add() {
    setErr("");
    const res = await fetch("/api/taxons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, label, slug: slug || undefined }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErr(data.error || "Не добавилось");
      return;
    }
    setLabel("");
    setSlug("");
    router.refresh();
  }

  async function saveEdit(id: number) {
    setErr("");
    const res = await fetch(`/api/taxons/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: editLabel, slug: editSlug }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErr(data.error || "Не сохранилось");
      return;
    }
    setEditId(null);
    router.refresh();
  }

  async function remove(item: Taxon) {
    setErr("");
    const first = await fetch(`/api/taxons/${item.id}`, { method: "DELETE" });
    const data = await first.json();
    if (first.status === 409) {
      const options = rows
        .filter((t) => t.id !== item.id)
        .map((t) => `${t.label} (${t.slug})`)
        .join(", ");
      if (!options) {
        setErr("Нельзя удалить последний пункт. Сначала добавьте другой.");
        return;
      }
      const target = prompt(
        `${item.label} стоит в ${data.used} записях.\nКуда перенести? Введите код одного из: ${rows
          .filter((t) => t.id !== item.id)
          .map((t) => t.slug)
          .join(", ")}`
      );
      if (!target) return;
      const second = await fetch(`/api/taxons/${item.id}?reassign=${encodeURIComponent(target)}`, {
        method: "DELETE",
      });
      const again = await second.json();
      if (!second.ok) {
        setErr(again.error || "Не удалилось");
        return;
      }
      router.refresh();
      return;
    }
    if (!first.ok) {
      setErr(data.error || "Не удалилось");
      return;
    }
    router.refresh();
  }

  return (
    <section className="taxon-col">
      <h2>{title}</h2>
      <ul className="taxon-list">
        {rows.map((item, index) => (
          <li key={item.id}>
            {editId === item.id ? (
              <div className="taxon-edit">
                <input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} />
                <input value={editSlug} onChange={(e) => setEditSlug(e.target.value)} />
                <button className="btn primary" type="button" onClick={() => saveEdit(item.id)}>
                  Ок
                </button>
                <button className="btn ghost" type="button" onClick={() => setEditId(null)}>
                  Нет
                </button>
              </div>
            ) : (
              <div className="taxon-row">
                <div>
                  <strong>{item.label}</strong>
                  <span className="tag">{item.slug}</span>
                </div>
                <div className="taxon-actions">
                  <span className="taxon-move">
                    <button
                      className="btn ghost"
                      type="button"
                      aria-label="Выше"
                      title="Выше"
                      disabled={index === 0 || busyId !== null}
                      onClick={() => void move(item, "up")}
                    >
                      ↑
                    </button>
                    <button
                      className="btn ghost"
                      type="button"
                      aria-label="Ниже"
                      title="Ниже"
                      disabled={index === rows.length - 1 || busyId !== null}
                      onClick={() => void move(item, "down")}
                    >
                      ↓
                    </button>
                  </span>
                  <button
                    className="btn ghost"
                    type="button"
                    onClick={() => {
                      setEditId(item.id);
                      setEditLabel(item.label);
                      setEditSlug(item.slug);
                    }}
                  >
                    Изменить
                  </button>
                  <button className="btn danger" type="button" onClick={() => remove(item)}>
                    Удалить
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
      <div className="taxon-add">
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Название" />
        <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="код (необяз.)" />
        <button className="btn primary" type="button" onClick={add} disabled={!label.trim()}>
          Добавить
        </button>
      </div>
      {err ? <p className="error">{err}</p> : null}
      {others.length === 0 && rows.length === 1 ? (
        <p className="hint">Последний пункт удалить нельзя, пока нет замены.</p>
      ) : null}
    </section>
  );
}

export function TaxonManager({ types, domains }: { types: Taxon[]; domains: Taxon[] }) {
  return (
    <div className="taxon-grid">
      <Section kind="type" title="Типы" items={types} />
      <Section kind="domain" title="Области" items={domains} />
    </div>
  );
}
