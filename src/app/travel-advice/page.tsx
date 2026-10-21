import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { publishedArticles, categories, publicMedia } from '@/lib/cms/data';
import { publicClient } from '@/lib/cms/client';
import { cmsConfig, publicOrigin } from '@/lib/cms/config';
import { imageUrl } from '@/lib/cms/urls';
import { cmsCopy } from '@/content/cms';
export function generateMetadata():Metadata {return {title:`${cmsCopy.title} | Planned by Jay`,description:cmsCopy.description,alternates:{canonical:`${publicOrigin()}/travel-advice`},robots:{index:process.env.CMS_PUBLIC_INDEXING==='true',follow:process.env.CMS_PUBLIC_INDEXING==='true'}};}
export default async function TravelAdvice() {
  const articles=await publishedArticles();const client=publicClient();const cats=client?await categories(client):[];
  const cards=await Promise.all(articles.map(async article=>({article,media:client?await publicMedia(client,article.featured_media_id):null})));
  return <main id="main-content" className="advice-index"><header><p className="eyebrow">Planned by Jay</p><h1>{cmsCopy.title}</h1><p>{cmsCopy.description}</p></header>
    {cards.length?<div className="advice-grid">{cards.map(({article,media})=><article className="advice-card" key={article.id}>{media&&<Image src={imageUrl(cmsConfig()!.url,media.storage_path)} alt={article.featured_alt} width={media.width} height={media.height} sizes="(max-width: 650px) 100vw, (max-width: 1000px) 50vw, 400px"/>}
      <div><p className="eyebrow">{cats.find(cat=>cat.id===article.category_id)?.name||article.content_type}</p><h2><Link href={`/travel-advice/${article.slug}`}>{article.title}</Link></h2><p>{article.excerpt}</p><small>{article.published_at&&new Date(article.published_at).toLocaleDateString('en-GB',{timeZone:'UTC'})}</small><p><Link href={`/travel-advice/${article.slug}`}>Read article <span aria-hidden="true">↗</span></Link></p></div>
    </article>)}</div>:<p>{cmsCopy.empty}</p>}
  </main>;
}
