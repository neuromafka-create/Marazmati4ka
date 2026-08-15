"use client";

import { useEffect } from "react";

export function Lightbox({
  src,
  alt,
  index,
  total,
  onClose,
  onPrev,
  onNext,
}: {
  src: string;
  alt?: string;
  index?: number;
  total?: number;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}) {
  const canNav = Boolean(onPrev && onNext && (total ?? 0) > 1);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev?.();
      if (e.key === "ArrowRight") onNext?.();
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, onPrev, onNext]);

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label="Просмотр картинки" onClick={onClose}>
      <button
        type="button"
        className="lightbox-x"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        title="Закрыть"
        aria-label="Закрыть"
      >
        ×
      </button>
      {canNav ? (
        <button
          type="button"
          className="lightbox-nav lightbox-prev"
          onClick={(e) => {
            e.stopPropagation();
            onPrev?.();
          }}
          title="Назад"
          aria-label="Предыдущая картинка"
        >
          ‹
        </button>
      ) : null}
      {canNav ? (
        <button
          type="button"
          className="lightbox-nav lightbox-next"
          onClick={(e) => {
            e.stopPropagation();
            onNext?.();
          }}
          title="Дальше"
          aria-label="Следующая картинка"
        >
          ›
        </button>
      ) : null}
      <img src={src} alt={alt || ""} onClick={(e) => e.stopPropagation()} />
      {canNav && index != null && total != null ? (
        <p className="lightbox-count" onClick={(e) => e.stopPropagation()}>
          {index + 1} / {total}
        </p>
      ) : null}
    </div>
  );
}
