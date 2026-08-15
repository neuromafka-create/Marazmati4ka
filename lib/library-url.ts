export function libraryUrl(opts: {
  q?: string;
  types?: string[];
  domains?: string[];
  sort?: string;
  dir?: string;
}) {
  const params = new URLSearchParams();
  if (opts.q) params.set("q", opts.q);
  for (const t of opts.types || []) params.append("type", t);
  for (const d of opts.domains || []) params.append("domain", d);
  if (opts.sort && opts.sort !== "updated") params.set("sort", opts.sort);
  if (opts.dir && opts.dir !== "desc") params.set("dir", opts.dir);
  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}
