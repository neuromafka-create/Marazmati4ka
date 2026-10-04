import fs from "node:fs";
import path from "node:path";
import { getDb } from "./db";
import { ALLOWED, MAX_BYTES, sniffMime } from "./media-kind";
import { DATA_DIR } from "./paths";
import {
  FALLBACK_COVER,
  customCoverSrc,
  isPlaceholderCoverId,
  presetCoverSrc,
  type PlaceholderCoverId,
} from "./placeholder-cover";

export const HUBRIS_DEFAULT_BASE = "https://api.hubris.pw/v1";
export const HUBRIS_DEFAULT_CHAT = "anthropic/claude-haiku-4.5";
export const HUBRIS_DEFAULT_IMAGE = "google/gemini-2.5-flash-image";

export type AppSettings = {
  hubrisApiKey: string;
  hubrisBaseUrl: string;
  hubrisChatModel: string;
  hubrisImageModel: string;
  placeholderCover: PlaceholderCoverId;
};

const KEYS = {
  hubrisApiKey: "hubris_api_key",
  hubrisBaseUrl: "hubris_base_url",
  hubrisChatModel: "hubris_chat_model",
  hubrisImageModel: "hubris_image_model",
  placeholderCover: "placeholder_cover",
  placeholderCoverV: "placeholder_cover_v",
} as const;

function ensureTable() {
  getDb().exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);
}

function getRaw(key: string): string {
  ensureTable();
  const row = getDb().prepare("SELECT value FROM settings WHERE key = ?").get(key) as { value: string } | undefined;
  return row?.value ?? "";
}

function readPlaceholderCoverId(): PlaceholderCoverId {
  const raw = getRaw(KEYS.placeholderCover);
  if (isPlaceholderCoverId(raw)) {
    if (raw === "custom" && !customPlaceholderFile()) return "notebook";
    return raw;
  }
  return "notebook";
}

export function getSettings(): AppSettings {
  return {
    hubrisApiKey: getRaw(KEYS.hubrisApiKey),
    hubrisBaseUrl: getRaw(KEYS.hubrisBaseUrl) || HUBRIS_DEFAULT_BASE,
    hubrisChatModel: getRaw(KEYS.hubrisChatModel) || HUBRIS_DEFAULT_CHAT,
    hubrisImageModel: getRaw(KEYS.hubrisImageModel) || HUBRIS_DEFAULT_IMAGE,
    placeholderCover: readPlaceholderCoverId(),
  };
}

export function maskKey(key: string) {
  const k = key.trim();
  if (!k) return "";
  if (k.length < 16) return `${k.slice(0, 6)}…`;
  return `${k.slice(0, 10)}…${k.slice(-4)}`;
}

export function publicSettings() {
  const s = getSettings();
  const custom = customPlaceholderFile();
  const customVersion = getRaw(KEYS.placeholderCoverV) || (custom ? String(custom.mtime) : "");
  return {
    hasKey: Boolean(s.hubrisApiKey),
    keyPreview: maskKey(s.hubrisApiKey),
    baseUrl: s.hubrisBaseUrl,
    chatModel: s.hubrisChatModel,
    imageModel: s.hubrisImageModel,
    placeholderCover: s.placeholderCover,
    placeholderCoverUrl: placeholderCoverUrl(),
    hasCustomCover: Boolean(custom),
    customCoverUrl: custom ? customCoverSrc(customVersion) : null,
  };
}

function putSimple(key: string, value: string) {
  ensureTable();
  const db = getDb();
  const exists = db.prepare("SELECT 1 AS x FROM settings WHERE key = ?").get(key);
  if (exists) db.prepare("UPDATE settings SET value = ? WHERE key = ?").run(value, key);
  else db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run(key, value);
}

export function saveSettings(patch: {
  hubrisApiKey?: string;
  hubrisBaseUrl?: string;
  hubrisChatModel?: string;
  hubrisImageModel?: string;
  placeholderCover?: string;
}) {
  if (patch.hubrisApiKey !== undefined) {
    const key = patch.hubrisApiKey.trim();
    if (key) putSimple(KEYS.hubrisApiKey, key);
  }
  if (patch.hubrisBaseUrl !== undefined) {
    const url = patch.hubrisBaseUrl.trim().replace(/\/+$/, "") || HUBRIS_DEFAULT_BASE;
    putSimple(KEYS.hubrisBaseUrl, url);
  }
  if (patch.hubrisChatModel !== undefined) {
    putSimple(KEYS.hubrisChatModel, patch.hubrisChatModel.trim() || HUBRIS_DEFAULT_CHAT);
  }
  if (patch.hubrisImageModel !== undefined) {
    putSimple(KEYS.hubrisImageModel, patch.hubrisImageModel.trim() || HUBRIS_DEFAULT_IMAGE);
  }
  if (patch.placeholderCover !== undefined) {
    savePlaceholderCover(patch.placeholderCover);
  }
  return publicSettings();
}

export function placeholderCoverUrl() {
  const id = readPlaceholderCoverId();
  if (id !== "custom") return presetCoverSrc(id);
  const custom = customPlaceholderFile();
  if (!custom) return FALLBACK_COVER;
  const v = getRaw(KEYS.placeholderCoverV) || String(custom.mtime);
  return customCoverSrc(v);
}

export function customPlaceholderFile(): { abs: string; mime: string; origName: string; mtime: number } | null {
  for (const [mime, ext] of Object.entries(ALLOWED)) {
    const abs = path.join(DATA_DIR, `placeholder-cover.${ext}`);
    if (!fs.existsSync(abs)) continue;
    return {
      abs,
      mime,
      origName: `placeholder-cover.${ext}`,
      mtime: fs.statSync(abs).mtimeMs,
    };
  }
  return null;
}

function removeCustomPlaceholderFiles() {
  for (const ext of Object.values(ALLOWED)) {
    const abs = path.join(DATA_DIR, `placeholder-cover.${ext}`);
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
  }
}

export function savePlaceholderCover(raw: string) {
  const id = raw.trim();
  if (!isPlaceholderCoverId(id)) throw new Error("Нет такой картинки по умолчанию");
  if (id === "custom" && !customPlaceholderFile()) {
    throw new Error("Сначала загрузите свою картинку");
  }
  putSimple(KEYS.placeholderCover, id);
}

export function saveCustomPlaceholderCover(buffer: Buffer, mime: string) {
  const sniffed = sniffMime(buffer, mime);
  const ext = ALLOWED[sniffed];
  if (!ext) throw new Error("Можно jpeg, png, webp или gif");
  if (buffer.length > MAX_BYTES) throw new Error("Файл больше 15 МБ");
  fs.mkdirSync(DATA_DIR, { recursive: true });
  removeCustomPlaceholderFiles();
  const abs = path.join(DATA_DIR, `placeholder-cover.${ext}`);
  fs.writeFileSync(abs, buffer);
  putSimple(KEYS.placeholderCover, "custom");
  putSimple(KEYS.placeholderCoverV, String(Date.now()));
  return publicSettings();
}

export function clearCustomPlaceholderCover() {
  removeCustomPlaceholderFiles();
  if (getRaw(KEYS.placeholderCover) === "custom") putSimple(KEYS.placeholderCover, "notebook");
  putSimple(KEYS.placeholderCoverV, String(Date.now()));
  return publicSettings();
}

export function clearHubrisKey() {
  getDb().prepare("DELETE FROM settings WHERE key = ?").run(KEYS.hubrisApiKey);
  return publicSettings();
}
