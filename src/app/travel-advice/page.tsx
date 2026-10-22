import type { Metadata } from 'next';
import { publicClient } from '@/lib/cms/client';
import { cmsConfig, publicOrigin } from '@/lib/cms/config';
import { cmsCopy, discoveryCopy } from '@/content/cms';
import { ArticleDiscovery } from '@/components/cms/ArticleDiscovery';
import { loadDiscovery } from '@/lib/cms/discovery';
import { parseDiscoveryQuery, type SearchParameters } from '@/lib/cms/discovery-query';
type Props={searchParams:Promise<SearchParameters>};
export async function generateMetadata({searchParams}:Props):Promise<Metadata> {
  const params=await searchParams;
  const filtered=Object.keys(params).length>0;
  const indexing=process.env.CMS_PUBLIC_INDEXING==='true';
  return {title:`${cmsCopy.title} | Planned by Jay`,description:cmsCopy.description,
    alternates:{canonical:`${publicOrigin()}/travel-advice`},robots:{index:indexing&&!filtered,follow:indexing}};
}
export default async function TravelAdvice({searchParams}:Props) {
  const {query,valid}=parseDiscoveryQuery(await searchParams);
  if(!valid)return <ArticleDiscovery query={query} results={null} error={discoveryCopy.invalid}/>;
  let results=null;let error:string|undefined;
  try {
    results=await loadDiscovery(publicClient(),cmsConfig()?.url||'',query);
  } catch {
    console.warn('article_discovery_unavailable');
    error=discoveryCopy.unavailable;
  }
  return <ArticleDiscovery query={query} results={results} error={error}/>;
}
