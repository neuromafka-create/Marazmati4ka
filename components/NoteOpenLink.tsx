"use client";

import Link from "next/link";
import { saveLibrarySpot } from "@/lib/library-return";

export function NoteOpenLink({
  noteId,
  href,
  className,
  title,
  children,
  ...rest
}: {
  noteId: number;
  href: string;
  className?: string;
  title?: string;
  children: React.ReactNode;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <Link href={href} className={className} title={title} onClick={() => saveLibrarySpot(noteId)} {...rest}>
      {children}
    </Link>
  );
}
