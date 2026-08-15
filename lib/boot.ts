import { countNotes } from "./notes";
import { importDocs } from "./import-docs";
import { seedTaxons } from "./taxonomy";

let ran = false;

export function ensureImported() {
  if (ran) return;
  ran = true;
  try {
    seedTaxons();
    if (countNotes() === 0) importDocs();
  } catch (err) {
    console.error("import failed", err);
  }
}
