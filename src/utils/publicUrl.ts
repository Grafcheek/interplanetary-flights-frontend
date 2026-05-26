/** Абсолютный URL статики с учётом base path (GitHub Pages: /repo-name/). */
export function publicUrl(path: string): string {
  const base = import.meta.env.BASE_URL || "/";
  const clean = path.replace(/^\//, "");
  return `${base}${clean}`;
}
