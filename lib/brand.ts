export type Brand = {
  id: "marazmati4ka" | "skleroznik";
  name: string;
  tag: string;
  search: string;
  description: string;
  empty: boolean;
};

const BRANDS: Record<Brand["id"], Brand> = {
  marazmati4ka: {
    id: "marazmati4ka",
    name: "Marazmati4ka",
    tag: "блокнот",
    search: "Найти промпт, гайд, термин…",
    description: "Блокнот промптов и инструкций",
    empty: false,
  },
  skleroznik: {
    id: "skleroznik",
    name: "Склерозник",
    tag: "блокнот",
    search: "Найти запись…",
    description: "Личный блокнот",
    empty: true,
  },
};

export function getBrand(): Brand {
  const raw = (process.env.MARAZ_FLAVOR || "").trim().toLowerCase();
  if (raw === "skleroznik") return BRANDS.skleroznik;
  return BRANDS.marazmati4ka;
}
