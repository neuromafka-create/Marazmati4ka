"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CodeFence } from "./CodeFence";

export function Markdown({
  source,
  onOpenImage,
}: {
  source: string;
  onOpenImage?: (src: string, alt?: string) => void;
}) {
  return (
    <div className="prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre({ children }) {
            return <CodeFence>{children}</CodeFence>;
          },
          img({ src, alt }) {
            const url = typeof src === "string" ? src : "";
            if (!url) return null;
            return (
              <button
                type="button"
                className="md-image"
                onClick={() => onOpenImage?.(url, alt)}
              >
                <img src={url} alt={alt || ""} />
              </button>
            );
          },
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
