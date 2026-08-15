import { attachFile, type FileRole } from "./files";
import { getSettings } from "./settings";

const CHAT_IMAGE = /gemini-.*-image|gpt-5(?:\.\d+)?-image/i;

export function isChatImageModel(model: string) {
  return CHAT_IMAGE.test(model);
}

function hubrisHeaders(apiKey: string) {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

function hubrisError(status: number, body: unknown) {
  const err = (body as { error?: { message?: string; code?: string } } | null)?.error;
  const msg = err?.message || "";
  if (status === 401) return "Ключ не принят. Проверьте API-ключ Hubris.";
  if (status === 402) return "Не хватает баланса на Hubris. Пополните в разделе Биллинг.";
  if (status === 429) return "Дневной лимит ключа исчерпан.";
  if (status === 404) return msg || "Модель недоступна на этом эндпоинте.";
  return msg || `Hubris ответил ${status}`;
}

async function readJson(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return { raw: text.slice(0, 400) };
  }
}

export async function testHubrisConnection() {
  const s = getSettings();
  if (!s.hubrisApiKey) throw new Error("Сначала сохраните API-ключ");
  const res = await fetch(`${s.hubrisBaseUrl}/models`, {
    headers: hubrisHeaders(s.hubrisApiKey),
    signal: AbortSignal.timeout(20000),
  });
  const data = await readJson(res);
  if (!res.ok) throw new Error(hubrisError(res.status, data));
  const list = Array.isArray((data as { data?: unknown[] })?.data)
    ? (data as { data: unknown[] }).data
    : Array.isArray(data)
      ? data
      : [];
  return { ok: true, models: list.length, baseUrl: s.hubrisBaseUrl };
}

function decodeImagePayload(raw: string): { buffer: Buffer; mime: string } {
  let mime = "image/png";
  let b64 = raw.trim();
  const dataUrl = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/s.exec(b64);
  if (dataUrl) {
    mime = dataUrl[1];
    b64 = dataUrl[2];
  }
  const buffer = Buffer.from(b64, "base64");
  if (buffer.length < 32) throw new Error("Hubris вернул пустую картинку");
  return { buffer, mime };
}

function extractChatImage(data: unknown): string {
  const msg = (data as { choices?: { message?: { images?: { image_url?: { url?: string } }[] } }[] })
    ?.choices?.[0]?.message;
  const url = msg?.images?.[0]?.image_url?.url;
  if (url) return url;
  throw new Error("Модель ответила без картинки. Выберите модель с выходом image.");
}

function extractImagesApi(data: unknown): string {
  const b64 = (data as { data?: { b64_json?: string }[] })?.data?.[0]?.b64_json;
  if (b64) return b64;
  throw new Error("Hubris не вернул изображение");
}

export type ImageRef = { mime: string; buffer: Buffer };

function toDataUrl(ref: ImageRef) {
  return `data:${ref.mime};base64,${ref.buffer.toString("base64")}`;
}

export async function generateIllustration(prompt: string, refs: ImageRef[] = []) {
  const s = getSettings();
  if (!s.hubrisApiKey) throw new Error("Сначала подключите Hubris в Настройках");
  const model = s.hubrisImageModel;
  const viaChat = isChatImageModel(model);
  const imageParts = refs.map((ref) => ({
    type: "image_url" as const,
    image_url: { url: toDataUrl(ref) },
  }));

  const res = await fetch(
    viaChat ? `${s.hubrisBaseUrl}/chat/completions` : `${s.hubrisBaseUrl}/images/generations`,
    {
      method: "POST",
      headers: hubrisHeaders(s.hubrisApiKey),
      signal: AbortSignal.timeout(120000),
      body: JSON.stringify(
        viaChat
          ? {
              model,
              modalities: ["image", "text"],
              messages: [
                {
                  role: "user",
                  content: imageParts.length
                    ? [{ type: "text", text: prompt }, ...imageParts]
                    : prompt,
                },
              ],
            }
          : {
              model,
              prompt,
              ...(imageParts.length ? { input_references: imageParts } : {}),
            }
      ),
    }
  );
  const data = await readJson(res);
  if (!res.ok) throw new Error(hubrisError(res.status, data));
  return decodeImagePayload(viaChat ? extractChatImage(data) : extractImagesApi(data));
}

export function attachGeneratedImage(opts: {
  noteId: number;
  buffer: Buffer;
  mime: string;
  role: FileRole;
  name?: string;
}) {
  return attachFile({
    noteId: opts.noteId,
    buffer: opts.buffer,
    mime: opts.mime,
    origName: opts.name || "illustration.png",
    role: opts.role,
  });
}
