export function isVideoFile(mime: string) {
  return mime.startsWith("video/");
}

export function isDocFile(mime: string) {
  return mime === "application/pdf";
}

export function NoteMedia({ mime, url, name }: { mime: string; url: string; name: string }) {
  if (isVideoFile(mime)) {
    return <video src={url} controls preload="metadata" playsInline />;
  }
  return <img src={url} alt={name} />;
}
