export const FALLBACK_COVER = "/cover-placeholder.jpg";

export const PLACEHOLDER_COVER_IDS = [
  "notebook",
  "cooking",
  "web",
  "games",
  "animals",
  "tales",
  "custom",
] as const;

export type PlaceholderCoverId = (typeof PLACEHOLDER_COVER_IDS)[number];
export type PlaceholderPresetId = Exclude<PlaceholderCoverId, "custom">;

export const PLACEHOLDER_PRESETS: { id: PlaceholderPresetId; label: string; src: string }[] = [
  { id: "notebook", label: "Записная книжка", src: FALLBACK_COVER },
  { id: "cooking", label: "Кулинария", src: "/covers/cooking.jpg" },
  { id: "web", label: "Веб", src: "/covers/web.jpg" },
  { id: "games", label: "Игры", src: "/covers/games.jpg" },
  { id: "animals", label: "Животные", src: "/covers/animals.jpg" },
  { id: "tales", label: "Сказки", src: "/covers/tales.jpg" },
];

export function isPlaceholderCoverId(value: string): value is PlaceholderCoverId {
  return (PLACEHOLDER_COVER_IDS as readonly string[]).includes(value);
}

export function presetCoverSrc(id: string) {
  return PLACEHOLDER_PRESETS.find((p) => p.id === id)?.src || FALLBACK_COVER;
}

export function customCoverSrc(version?: string | null) {
  const v = (version || "").trim();
  return v ? `/api/settings/cover?v=${encodeURIComponent(v)}` : "/api/settings/cover";
}
