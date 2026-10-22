import 'server-only';
import type { MetadataRoute } from 'next';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { holidayTypes } from '@/content/holiday-types';

const entry = z.object({
  slug: z.string().max(140).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  updated_at: z.iso.datetime({ offset: true }),
  status: z.literal('published'),
});
export async function loadSitemapArticles(client: SupabaseClient | null) {
  if (!client) throw new Error('sitemap_cms_unconfigured');
  // Anonymous/RLS access only. No article bodies, editorial notes or stale cached URLs.
  const result = await client.from('content_articles').select('slug,updated_at,status')
    .eq('status', 'published').order('published_at', { ascending: false })
    .abortSignal(AbortSignal.timeout(5000));
  if (result.error) throw new Error(result.status === 0 ? 'sitemap_cms_transport_failed'
    : result.status === 401 || result.status === 403 ? 'sitemap_cms_access_denied'
    : 'sitemap_cms_query_failed');
  return z.array(entry).parse(result.data);
}

export async function buildPublicSitemap(
  origin: string,
  policyLinks: { href: string }[],
  load: () => Promise<z.infer<typeof entry>[]>,
  warn: (event: string) => void = event => console.warn(event),
): Promise<MetadataRoute.Sitemap> {
  const stable: MetadataRoute.Sitemap = [
    { url: origin }, { url: `${origin}/why-jay` }, { url: `${origin}/travel-advice` },
    { url: `${origin}/holidays` }, ...holidayTypes.map(item=>({url:`${origin}/holidays/${item.slug}`})),
    ...policyLinks.map(policy => ({ url: `${origin}${policy.href}` })),
  ];
  try {
    const articles = await load();
    return [...stable, ...articles.filter(article => article.status === 'published')
      .map(article => ({ url: `${origin}/travel-advice/${article.slug}`, lastModified: article.updated_at }))];
  } catch (error) {
    // A partial sitemap is real stable content, not a claim that the article library is empty.
    // Fixed codes only: never log provider messages, URLs/keys or article/customer payloads.
    const codes: Record<string, string> = {
      sitemap_cms_unconfigured: 'cms_unconfigured',
      sitemap_cms_transport_failed: 'cms_transport_failed',
      sitemap_cms_access_denied: 'cms_access_denied',
      sitemap_cms_query_failed: 'cms_query_failed',
    };
    warn(`sitemap_stable_only:${error instanceof Error ? codes[error.message] || 'cms_unavailable' : 'cms_unavailable'}`);
    return stable;
  }
}
