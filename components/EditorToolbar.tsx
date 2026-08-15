"use client";

import type { RefObject } from "react";
import type { Edit } from "@/lib/md-format";
import { insertHr, prefixLines, setHeading, wrapFence, wrapInline, wrapLink } from "@/lib/md-format";

export function EditorToolbar({
  value,
  textareaRef,
  onApply,
}: {
  value: string;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  onApply: (next: Edit) => void;
}) {
  function run(fn: (text: string, from: number, to: number) => Edit) {
    const el = textareaRef.current;
    const from = el?.selectionStart ?? value.length;
    const to = el?.selectionEnd ?? value.length;
    onApply(fn(value, from, to));
  }

  function link() {
    const url = window.prompt("Адрес ссылки", "https://");
    if (!url) return;
    run((text, from, to) => wrapLink(text, from, to, url.trim()));
  }

  function holdSelection(e: React.MouseEvent) {
    e.preventDefault();
  }

  return (
    <div className="fmt-bar" role="toolbar" aria-label="Форматирование">
      <div className="fmt-group" aria-label="Инлайн">
        <span className="fmt-label">Инлайн</span>
        <button type="button" className="fmt-btn" title="Жирный (Ctrl+B)" aria-label="Жирный" onMouseDown={holdSelection} onClick={() => run((t, a, b) => wrapInline(t, a, b, "**"))}>
          <b>Ж</b>
        </button>
        <button type="button" className="fmt-btn" title="Курсив (Ctrl+I)" aria-label="Курсив" onMouseDown={holdSelection} onClick={() => run((t, a, b) => wrapInline(t, a, b, "*"))}>
          <i>К</i>
        </button>
        <button type="button" className="fmt-btn" title="Зачёркнутый" aria-label="Зачёркнутый" onMouseDown={holdSelection} onClick={() => run((t, a, b) => wrapInline(t, a, b, "~~"))}>
          <s>З</s>
        </button>
        <button type="button" className="fmt-btn fmt-mono" title="Код в строке" aria-label="Код в строке" onMouseDown={holdSelection} onClick={() => run((t, a, b) => wrapInline(t, a, b, "`"))}>
          {"</>"}
        </button>
        <button type="button" className="fmt-btn" title="Ссылка (Ctrl+K)" aria-label="Ссылка" onMouseDown={holdSelection} onClick={link}>
          Ссылка
        </button>
      </div>
      <div className="fmt-group" aria-label="Блок">
        <span className="fmt-label">Блок</span>
        <button type="button" className="fmt-btn" title="Обычный абзац" aria-label="Абзац" onMouseDown={holdSelection} onClick={() => run((t, a, b) => setHeading(t, a, b, 0))}>
          P
        </button>
        <button type="button" className="fmt-btn" title="Заголовок 1" aria-label="Заголовок 1" onMouseDown={holdSelection} onClick={() => run((t, a, b) => setHeading(t, a, b, 1))}>
          H1
        </button>
        <button type="button" className="fmt-btn" title="Заголовок 2" aria-label="Заголовок 2" onMouseDown={holdSelection} onClick={() => run((t, a, b) => setHeading(t, a, b, 2))}>
          H2
        </button>
        <button type="button" className="fmt-btn" title="Заголовок 3" aria-label="Заголовок 3" onMouseDown={holdSelection} onClick={() => run((t, a, b) => setHeading(t, a, b, 3))}>
          H3
        </button>
        <button type="button" className="fmt-btn" title="Маркированный список" aria-label="Маркированный список" onMouseDown={holdSelection} onClick={() => run((t, a, b) => prefixLines(t, a, b, "- "))}>
          •
        </button>
        <button type="button" className="fmt-btn" title="Нумерованный список" aria-label="Нумерованный список" onMouseDown={holdSelection} onClick={() => run((t, a, b) => prefixLines(t, a, b, "1. "))}>
          1.
        </button>
        <button type="button" className="fmt-btn" title="Чек-лист" aria-label="Чек-лист" onMouseDown={holdSelection} onClick={() => run((t, a, b) => prefixLines(t, a, b, "- [ ] "))}>
          ☐
        </button>
        <button type="button" className="fmt-btn" title="Цитата" aria-label="Цитата" onMouseDown={holdSelection} onClick={() => run((t, a, b) => prefixLines(t, a, b, "> "))}>
          «»
        </button>
        <button type="button" className="fmt-btn fmt-mono" title="Блок кода" aria-label="Блок кода" onMouseDown={holdSelection} onClick={() => run((t, a, b) => wrapFence(t, a, b, "text"))}>
          {`{ }`}
        </button>
        <button type="button" className="fmt-btn" title="Разделитель" aria-label="Разделитель" onMouseDown={holdSelection} onClick={() => run((t, a) => insertHr(t, a))}>
          ―
        </button>
      </div>
    </div>
  );
}
