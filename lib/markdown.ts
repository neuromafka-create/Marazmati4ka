import crypto from "node:crypto";

export function snippetOf(body: string, max = 220) {
  const plain = body
    .replace(/^---[\s\S]*?---\s*/, "")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[`#>*_~\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > max ? `${plain.slice(0, max).trim()}…` : plain;
}

export function extractTitle(body: string, fallback: string) {
  const heading = body.match(/^#\s+(.+)$/m);
  if (heading) {
    return heading[1].replace(/[*_`]/g, "").trim();
  }
  return fallback.replace(/\.md$/i, "").trim() || "Без названия";
}

export function extractSource(body: string): string | null {
  const m =
    body.match(/\*\*\[?\*?Источник[^\]]*\]?\*?\*\*\s*\((https?:\/\/[^)]+)\)/i) ||
    body.match(/\[Источник[^\]]*\]\((https?:\/\/[^)]+)\)/i) ||
    body.match(/Источник:\s*(https?:\/\/\S+)/i) ||
    body.match(/https?:\/\/t\.me\/[^\s)]+/);
  return m ? (m[1] || m[0]).replace(/[.,;]+$/, "") : null;
}

export function extractPrompt(body: string): string | null {
  const fence = body.match(/```(?:txt|text|markdown|md|prompt)?\s*\n([\s\S]*?)```/i);
  if (fence?.[1]?.trim()) return fence[1].trim();
  return null;
}

export function stripFrontmatter(raw: string) {
  if (!raw.startsWith("---")) return raw;
  const end = raw.indexOf("\n---", 3);
  if (end === -1) return raw;
  return raw.slice(end + 4).replace(/^\s+/, "");
}

export function hashText(text: string) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

export function slugify(input: string) {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z",
    и: "i", й: "i", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
    с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sch",
    ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  };
  const translit = input
    .toLowerCase()
    .split("")
    .map((ch) => map[ch] ?? ch)
    .join("");
  const slug = translit
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || "note";
}

export function nowIso() {
  return new Date().toISOString();
}

const BASE64_RE = /!\[[^\]]*\]\((data:image\/(png|jpe?g|gif|webp);base64,([A-Za-z0-9+/=\s]+))\)/gi;

export function extractBase64Images(body: string) {
  const found: { mime: string; ext: string; data: Buffer; placeholder: string }[] = [];
  const cleaned = body.replace(BASE64_RE, (_all, _src, kind: string, b64: string) => {
    const ext = kind === "jpeg" || kind === "jpg" ? "jpg" : kind;
    const mime = `image/${ext === "jpg" ? "jpeg" : ext}`;
    const data = Buffer.from(b64.replace(/\s+/g, ""), "base64");
    const token = `@@IMG${found.length}@@`;
    found.push({ mime, ext, data, placeholder: token });
    return `![image](${token})`;
  });
  return { body: cleaned, images: found };
}
