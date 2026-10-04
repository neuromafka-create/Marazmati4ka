import { AiSettings } from "@/components/AiSettings";
import { AppShell } from "@/components/AppShell";
import { CoverSettings } from "@/components/CoverSettings";
import { TaxonManager } from "@/components/TaxonManager";
import { publicSettings } from "@/lib/settings";
import { listTaxons, seedTaxons } from "@/lib/taxonomy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default function SettingsPage() {
  seedTaxons();
  const settings = publicSettings();
  return (
    <AppShell>
      <div className="note-page">
        <div className="crumbs">Настройки</div>
        <h1 className="settings-title">Настройки</h1>
        <p className="settings-lead">Локальный блокнот: нейросеть, типы и области. Всё живёт в вашей базе.</p>
        <CoverSettings initial={settings} />
        <AiSettings initial={settings} />
        <section className="settings-block">
          <h2>Типы и области</h2>
          <p className="settings-lead" style={{ marginBottom: 16 }}>
            Как разделы инфоблока: живут в базе. Код идёт в путь файла, название — на экране.
          </p>
          <TaxonManager types={listTaxons("type")} domains={listTaxons("domain")} />
        </section>
      </div>
    </AppShell>
  );
}
