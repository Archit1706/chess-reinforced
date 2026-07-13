/**
 * Canonical, stable production URL used for all SEO metadata, canonicals,
 * Open Graph links, robots.txt and the sitemap.
 *
 * Order of precedence:
 *  1. NEXT_PUBLIC_APP_URL — set this to a custom domain when one exists.
 *  2. VERCEL_PROJECT_PRODUCTION_URL — Vercel's STABLE production domain
 *     (unlike VERCEL_URL, which is a different per-deployment URL and would
 *     scatter canonicals across preview deploys — bad for indexing).
 *  3. The known production alias as a safe default.
 *
 * Always an absolute origin with no trailing slash.
 */
function resolveSiteUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'https://chess-reinforced.vercel.app');
  return fromEnv.replace(/\/+$/, '');
}

export const SITE_URL = resolveSiteUrl();

/** Build an absolute URL for a site-relative path. */
export function absoluteUrl(path = '/'): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Turn a kebab-case slug into a human, Title-Cased string ("back-rank-mate" → "Back Rank Mate"). */
export function titleFromSlug(slug: string): string {
  return decodeURIComponent(slug)
    .split('-')
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
}
