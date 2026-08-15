import Link from "next/link";
import { Shell } from "@/components/Shell";

export default function NotFound() {
  return (
    <Shell>
      <div className="empty">
        <p>Такой записи нет.</p>
        <p>
          <Link href="/">Вернуться в библиотеку</Link>
        </p>
      </div>
    </Shell>
  );
}
