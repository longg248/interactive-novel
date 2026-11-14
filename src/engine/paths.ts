/**
 * Build a URL for a file served from `public/`.
 *
 * Vite's `base` config (e.g. `/interactive-novel/` for GitHub Pages) is not part of
 * absolute paths written by hand, so every runtime asset lookup has to go through
 * here. `BASE_URL` always ends with a slash and is `/` in dev.
 */
const BASE = import.meta.env.BASE_URL;

export function assetUrl(path: string): string {
  return `${BASE}${path.replace(/^\/+/, '')}`;
}
