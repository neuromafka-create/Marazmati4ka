export const QUOTE_STYLE_IDS = ["bronze", "graphite", "forest", "wine", "ink"] as const;

export type QuoteStyleId = (typeof QUOTE_STYLE_IDS)[number];

export const DEFAULT_QUOTE_STYLE: QuoteStyleId = "bronze";

export const QUOTE_STYLES: { id: QuoteStyleId; label: string }[] = [
  { id: "bronze", label: "Тёмная бронза" },
  { id: "graphite", label: "Графит" },
  { id: "forest", label: "Хвоя" },
  { id: "wine", label: "Вино" },
  { id: "ink", label: "Чернила" },
];

export function isQuoteStyleId(value: string): value is QuoteStyleId {
  return (QUOTE_STYLE_IDS as readonly string[]).includes(value);
}

export function parseQuoteStyle(value?: string | null): QuoteStyleId {
  return value && isQuoteStyleId(value) ? value : DEFAULT_QUOTE_STYLE;
}
