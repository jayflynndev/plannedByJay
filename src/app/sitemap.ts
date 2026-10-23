import type { MetadataRoute } from 'next';
import { publicClient } from '@/lib/cms/client';
import { buildPublicSitemap, loadSitemapArticles } from '@/lib/cms/sitemap';
import { publicOrigin } from '@/lib/cms/config';
import { approvedPolicies } from '@/content/policies';
import {offerSitemap} from '@/lib/offers/sitemap';
export const dynamic='force-dynamic';
export default async function sitemap():Promise<MetadataRoute.Sitemap> {
  const [existing,offers]=await Promise.all([buildPublicSitemap(publicOrigin(), approvedPolicies(), () => loadSitemapArticles(publicClient())),offerSitemap(publicOrigin())]);return [...existing,...offers];
}
