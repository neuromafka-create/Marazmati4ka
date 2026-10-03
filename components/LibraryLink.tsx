"use client";

import { useRouter } from "next/navigation";
import { libraryReturnHref } from "@/lib/library-return";

export function LibraryLink({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <a
      href="/"
      className={className}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        router.push(libraryReturnHref());
      }}
    >
      {children}
    </a>
  );
}
