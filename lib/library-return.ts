const KEY = "mz-library";

export type LibrarySpot = {
  href: string;
  scroll: number;
  noteId?: number;
};

function isLibraryPath(path: string) {
  return path === "/";
}

export function readLibrarySpot(): LibrarySpot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as LibrarySpot;
    if (!data?.href || !data.href.startsWith("/")) return null;
    return data;
  } catch {
    return null;
  }
}

export function libraryReturnHref() {
  return readLibrarySpot()?.href || "/";
}

export function saveLibrarySpot(noteId?: number) {
  if (typeof window === "undefined") return;
  if (!isLibraryPath(window.location.pathname)) return;
  const href = `${window.location.pathname}${window.location.search}`;
  const prev = readLibrarySpot();
  const spot: LibrarySpot = {
    href,
    scroll: window.scrollY,
    noteId: noteId ?? prev?.noteId,
  };
  sessionStorage.setItem(KEY, JSON.stringify(spot));
}

export function rememberLibraryScroll() {
  if (typeof window === "undefined") return;
  if (!isLibraryPath(window.location.pathname)) return;
  const prev = readLibrarySpot();
  const href = `${window.location.pathname}${window.location.search}`;
  sessionStorage.setItem(
    KEY,
    JSON.stringify({
      href,
      scroll: window.scrollY,
      noteId: prev?.href === href ? prev.noteId : undefined,
    } satisfies LibrarySpot)
  );
}

export function restoreLibrarySpot() {
  if (typeof window === "undefined") return;
  const data = readLibrarySpot();
  if (!data) return;
  const now = `${window.location.pathname}${window.location.search}`;
  if (data.href !== now) return;
  if (data.noteId) {
    const el = document.getElementById(`note-${data.noteId}`);
    if (el) {
      el.scrollIntoView({ block: "center" });
      return;
    }
  }
  window.scrollTo(0, data.scroll || 0);
}
