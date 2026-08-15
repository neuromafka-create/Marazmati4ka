"use client";

import { useEffect } from "react";

export function Lightbox({
  src,
  alt,
  onClose,
  onPrev,
  onNext,
}: {
  src: string;
  alt?: string;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}) {
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
    <div className="lightbox" role="dialog" aria-modal="true" onClick={onClose}>
      <button type="button" className="lightbox-x" onClick={onClose} title="Закрыть">
        ×
      </button>
      {onPrev ? (
        <button
          type="button"
          className="lightbox-nav lightbox-prev"
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          title="Назад"
        >
          ‹
        </button>
      ) : null}
      {onNext ? (
        <button
          type="button"
          className="lightbox-nav lightbox-next"
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          title="Дальше"
        >
          ›
        </button>
      ) : null}
      <img
        src={src}
        alt={alt || ""}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
