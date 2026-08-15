export type Edit = { text: string; start: number; end: number };

const BLOCK_PREFIX = /^(?:#{1,6}\s+|>\s+|[-*+]\s+(?:\[[ xX]\]\s+)?|\d+\.\s+)/;

function lineBounds(text: string, from: number, to: number) {
  const start = text.lastIndexOf("\n", Math.max(0, from - 1)) + 1;
  const nl = text.indexOf("\n", to);
  const end = nl === -1 ? text.length : nl;
  return { start, end };
}

function stripBlock(line: string) {
  return line.replace(BLOCK_PREFIX, "");
}

function isWrapped(selected: string, left: string, right: string) {
  if (selected.length < left.length + right.length) return false;
  if (!selected.startsWith(left) || !selected.endsWith(right)) return false;
  // "*" must not unwrap "**жирный**"
  if (left === "*" && selected.startsWith("**") && selected.endsWith("**")) return false;
  return true;
}

function isSurrounded(text: string, start: number, end: number, left: string, right: string) {
  if (text.slice(start - left.length, start) !== left) return false;
  if (text.slice(end, end + right.length) !== right) return false;
  if (left === "*" && text.slice(start - 2, start) === "**" && text.slice(end, end + 2) === "**") return false;
  return true;
}

export function wrapInline(text: string, from: number, to: number, left: string, right = left): Edit {
  const start = from;
  const end = to;
  if (start === end) {
    const insert = `${left}текст${right}`;
    return {
      text: text.slice(0, start) + insert + text.slice(end),
      start: start + left.length,
      end: start + left.length + "текст".length,
    };
  }
  const selected = text.slice(start, end);
  if (isWrapped(selected, left, right)) {
    const inner = selected.slice(left.length, selected.length - right.length);
    return { text: text.slice(0, start) + inner + text.slice(end), start, end: start + inner.length };
  }
  if (isSurrounded(text, start, end, left, right)) {
    return {
      text: text.slice(0, start - left.length) + selected + text.slice(end + right.length),
      start: start - left.length,
      end: end - left.length,
    };
  }
  return {
    text: text.slice(0, start) + left + selected + right + text.slice(end),
    start: start + left.length,
    end: end + left.length,
  };
}

export function prefixLines(text: string, from: number, to: number, prefix: string): Edit {
  const { start, end } = lineBounds(text, from, to);
  const block = text.slice(start, end);
  const lines = block.split("\n");
  const allOn = lines.every((line) => !line.trim() || line.startsWith(prefix));
  const next = lines
    .map((line) => {
      if (!line.trim()) return line;
      if (allOn) return stripBlock(line);
      return prefix + stripBlock(line);
    })
    .join("\n");
  return { text: text.slice(0, start) + next + text.slice(end), start, end: start + next.length };
}

export function setHeading(text: string, from: number, to: number, level: 0 | 1 | 2 | 3): Edit {
  const { start, end } = lineBounds(text, from, to);
  const block = text.slice(start, end);
  const lines = block.split("\n");
  const mark = level === 0 ? "" : "#".repeat(level) + " ";
  const next = lines
    .map((line) => {
      if (!line.trim()) return line;
      return mark + stripBlock(line);
    })
    .join("\n");
  return { text: text.slice(0, start) + next + text.slice(end), start, end: start + next.length };
}

export function wrapFence(text: string, from: number, to: number, lang = "text"): Edit {
  let start = from;
  let end = to;
  if (start === end) {
    const { start: ls, end: le } = lineBounds(text, from, to);
    start = ls;
    end = le;
  }
  const selected = text.slice(start, end) || "код";
  const fenced = selected.startsWith("```") && selected.trim().endsWith("```");
  if (fenced) {
    const inner = selected.replace(/^```[^\n]*\n?/, "").replace(/\n?```\s*$/, "");
    return { text: text.slice(0, start) + inner + text.slice(end), start, end: start + inner.length };
  }
  const block = `\`\`\`${lang}\n${selected}\n\`\`\``;
  return { text: text.slice(0, start) + block + text.slice(end), start: start + 4 + lang.length, end: start + 4 + lang.length + selected.length };
}

export function insertHr(text: string, from: number): Edit {
  const { end } = lineBounds(text, from, from);
  const insert = `${end === text.length || text[end] === "\n" ? "\n" : "\n"}---\n`;
  const at = end;
  return { text: text.slice(0, at) + insert + text.slice(at), start: at + insert.length, end: at + insert.length };
}

export function wrapLink(text: string, from: number, to: number, url: string): Edit {
  const selected = text.slice(from, to) || "ссылка";
  const start = from === to ? from : from;
  const md = `[${selected}](${url})`;
  return {
    text: text.slice(0, start) + md + text.slice(to),
    start: start + 1,
    end: start + 1 + selected.length,
  };
}
