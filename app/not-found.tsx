import Link from "next/link";
import { AppShell } from "@/components/AppShell";

export default function NotFound() {
  return (
    <AppShell>
      <div className="empty">
        <p>Такой записи нет.</p>
        <p>
          <Link href="/">Вернуться в библиотеку</Link>
        </p>
      </div>
    </AppShell>
  );
}
