"use client";

import { useLayoutEffect } from "react";
import { rememberLibraryScroll, restoreLibrarySpot } from "@/lib/library-return";

export function LibraryRestore() {
  useLayoutEffect(() => {
    restoreLibrarySpot();
    const later = window.setTimeout(restoreLibrarySpot, 80);
    const onScroll = () => rememberLibraryScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.clearTimeout(later);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);
  return null;
}
