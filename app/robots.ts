import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

/**
 * Served at /robots.txt. Allows crawling of all public content, but keeps the
 * API and user-specific utility pages (settings, dashboard, my games) out of
 * the index so crawl budget goes to the pages worth ranking.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/settings', '/dashboard', '/games'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
