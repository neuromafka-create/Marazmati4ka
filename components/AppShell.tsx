import { getBrand } from "@/lib/brand";
import { publicSettings } from "@/lib/settings";
import { Shell } from "./Shell";

export function AppShell({
  children,
  initialQuery,
}: {
  children: React.ReactNode;
  initialQuery?: string;
}) {
  return (
    <Shell initialQuery={initialQuery} brand={getBrand()} quoteStyle={publicSettings().quoteStyle}>
      {children}
    </Shell>
  );
}
