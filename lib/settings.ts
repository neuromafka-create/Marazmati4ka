import { getDb } from "./db";

export const HUBRIS_DEFAULT_BASE = "https://api.hubris.pw/v1";
export const HUBRIS_DEFAULT_CHAT = "anthropic/claude-haiku-4.5";
export const HUBRIS_DEFAULT_IMAGE = "google/gemini-2.5-flash-image";

export type AppSettings = {
  hubrisApiKey: string;
  hubrisBaseUrl: string;
  hubrisChatModel: string;
  hubrisImageModel: string;
};

const KEYS = {
  hubrisApiKey: "hubris_api_key",
  hubrisBaseUrl: "hubris_base_url",
  hubrisChatModel: "hubris_chat_model",
  hubrisImageModel: "hubris_image_model",
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

export function getSettings(): AppSettings {
  return {
    hubrisApiKey: getRaw(KEYS.hubrisApiKey),
    hubrisBaseUrl: getRaw(KEYS.hubrisBaseUrl) || HUBRIS_DEFAULT_BASE,
    hubrisChatModel: getRaw(KEYS.hubrisChatModel) || HUBRIS_DEFAULT_CHAT,
    hubrisImageModel: getRaw(KEYS.hubrisImageModel) || HUBRIS_DEFAULT_IMAGE,
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
  return {
    hasKey: Boolean(s.hubrisApiKey),
    keyPreview: maskKey(s.hubrisApiKey),
    baseUrl: s.hubrisBaseUrl,
    chatModel: s.hubrisChatModel,
    imageModel: s.hubrisImageModel,
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
  return publicSettings();
}

export function clearHubrisKey() {
  getDb().prepare("DELETE FROM settings WHERE key = ?").run(KEYS.hubrisApiKey);
  return publicSettings();
}
