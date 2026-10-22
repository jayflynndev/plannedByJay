import type { MetadataRoute } from 'next';
import { publicClient } from '@/lib/cms/client';
import { buildPublicSitemap, loadSitemapArticles } from '@/lib/cms/sitemap';
import { publicOrigin } from '@/lib/cms/config';
import { approvedPolicies } from '@/content/policies';
export const dynamic='force-dynamic';
export default async function sitemap():Promise<MetadataRoute.Sitemap> {
  return buildPublicSitemap(publicOrigin(), approvedPolicies(), () => loadSitemapArticles(publicClient()));
}
