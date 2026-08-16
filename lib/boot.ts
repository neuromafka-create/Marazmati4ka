import { countNotes } from "./notes";
import { importDocs, seedDocsFromFolder } from "./import-docs";
import { seedTaxons } from "./taxonomy";

let ran = false;

export function ensureImported() {
  if (ran) return;
  ran = true;
  try {
    seedTaxons();
    if (countNotes() === 0) {
      const seed = (process.env.MARAZ_SEED_DIR || "").trim();
      if (seed) {
        const seeded = seedDocsFromFolder(seed);
        console.log(`seed from ${seed}: scanned=${seeded.scanned} copied=${seeded.copied}`);
      }
      const imported = importDocs();
      console.log(`import docs: scanned=${imported.scanned} created=${imported.created}`);
    }
  } catch (err) {
    console.error("import failed", err);
  }
}
