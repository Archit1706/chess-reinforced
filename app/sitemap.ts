import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/site';

/**
 * Served at /sitemap.xml. Lists the primary indexable pages plus the seeded
 * famous-game study pages (stable ids). Individual lesson pages are reached via
 * internal links from /lessons and are intentionally omitted here to keep the
 * sitemap decoupled from DB content and always correct.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const primary: Array<{ path: string; priority: number; freq: MetadataRoute.Sitemap[number]['changeFrequency'] }> = [
    { path: '/', priority: 1.0, freq: 'weekly' },
    { path: '/lessons', priority: 0.9, freq: 'weekly' },
    { path: '/puzzles', priority: 0.9, freq: 'daily' },
    { path: '/play', priority: 0.8, freq: 'monthly' },
    { path: '/study', priority: 0.7, freq: 'monthly' },
    { path: '/coordinates', priority: 0.6, freq: 'monthly' },
  ];

  // Seeded famous games (ids from prisma/seed.ts) — stable, high-interest content.
  const famousGameIds = [
    'immortal-game',
    'game-of-the-century',
    'opera-game',
    'evergreen-game',
    'reti-tartakower',
  ];

  return [
    ...primary.map(({ path, priority, freq }) => ({
      url: absoluteUrl(path),
      lastModified: now,
      changeFrequency: freq,
      priority,
    })),
    ...famousGameIds.map((id) => ({
      url: absoluteUrl(`/study/${id}`),
      lastModified: now,
      changeFrequency: 'yearly' as const,
      priority: 0.5,
    })),
  ];
}
