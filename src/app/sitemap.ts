import type { MetadataRoute } from 'next';
import { publishedArticles } from '@/lib/cms/data';
import { publicOrigin } from '@/lib/cms/config';
import { approvedPolicies } from '@/content/policies';
export const dynamic='force-dynamic';
export default async function sitemap():Promise<MetadataRoute.Sitemap> {
  const origin=publicOrigin();const articles=await publishedArticles();
  return [{url:origin},{url:`${origin}/why-jay`},{url:`${origin}/travel-advice`},...approvedPolicies().map(policy=>({url:`${origin}${policy.href}`})),...articles.map(article=>({url:`${origin}/travel-advice/${article.slug}`,lastModified:article.updated_at}))];
}
