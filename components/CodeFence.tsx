"use client";

import { Children, isValidElement, useState, type ReactNode } from "react";

function languageOf(className?: string) {
  const raw = (className || "").match(/language-([a-z0-9+#-]+)/i)?.[1] || "text";
  const aliases: Record<string, string> = {
    js: "js",
    javascript: "js",
    ts: "ts",
    typescript: "ts",
    bash: "bash",
    sh: "bash",
    shell: "bash",
    zsh: "bash",
    txt: "text",
    text: "text",
    md: "markdown",
    markdown: "markdown",
    py: "python",
    python: "python",
    json: "json",
    css: "css",
    html: "html",
    sql: "sql",
    yaml: "yaml",
    yml: "yaml",
    prompt: "prompt",
  };
  return aliases[raw.toLowerCase()] || raw.toLowerCase();
}

export function CodeFence({ children }: { children: ReactNode }) {
  const [copied, setCopied] = useState(false);
  const codeEl = Children.toArray(children).find(isValidElement) as
    | { props?: { className?: string; children?: ReactNode } }
    | undefined;
  const className = codeEl?.props?.className || "";
  const lang = languageOf(className);
  const text = String(codeEl?.props?.children ?? children).replace(/\n$/, "");

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div className="code-fence">
      <div className="code-fence-bar">
        <span className="code-fence-lang">{lang}</span>
        <button type="button" className="btn ghost code-fence-copy" onClick={copy}>
          {copied ? "Скопировано" : "Копировать"}
        </button>
      </div>
      <pre>
        <code className={className}>{text}</code>
      </pre>
    </div>
  );
}
