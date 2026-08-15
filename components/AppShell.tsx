import { getBrand } from "@/lib/brand";
import { Shell } from "./Shell";

export function AppShell({
  children,
  initialQuery,
}: {
  children: React.ReactNode;
  initialQuery?: string;
}) {
  return (
    <Shell initialQuery={initialQuery} brand={getBrand()}>
      {children}
    </Shell>
  );
}
