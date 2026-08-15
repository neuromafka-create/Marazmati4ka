import { Shell } from "@/components/Shell";
import { TaxonManager } from "@/components/TaxonManager";
import { listTaxons, seedTaxons } from "@/lib/taxonomy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default function SettingsPage() {
  seedTaxons();
  return (
    <Shell>
      <div className="note-page">
        <div className="crumbs">Справочники</div>
        <h1 className="settings-title">Типы и области</h1>
        <p className="settings-lead">
          Как разделы инфоблока: живут в базе. Код идёт в путь файла, название — на экране.
        </p>
        <TaxonManager types={listTaxons("type")} domains={listTaxons("domain")} />
      </div>
    </Shell>
  );
}
