import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { publicClient } from '@/lib/cms/client';
import { cmsConfig, publicOrigin } from '@/lib/cms/config';
import { categories, databaseError, publishedArticle, publicMedia } from '@/lib/cms/data';
import { imageUrl } from '@/lib/cms/urls';
import { ArticleView } from '@/components/cms/ArticleView';
import Link from 'next/link';
type Props={params:Promise<{slug:string}>};
export async function generateMetadata({params}:Props):Promise<Metadata> {
  const article=await publishedArticle((await params).slug);if(!article)return {title:'Article unavailable',robots:{index:false,follow:false}};
  const client=publicClient()!;const media=await publicMedia(client,article.featured_media_id);const canonical=article.canonical_url||`${publicOrigin()}/travel-advice/${article.slug}`;
  return {title:`${article.seo_title||article.title} | Planned by Jay`,description:article.seo_description||article.excerpt,
    alternates:{canonical},robots:{index:process.env.CMS_PUBLIC_INDEXING==='true',follow:process.env.CMS_PUBLIC_INDEXING==='true'},
    openGraph:{type:'article',title:article.seo_title||article.title,description:article.seo_description||article.excerpt,url:canonical,publishedTime:article.published_at||undefined,modifiedTime:article.updated_at,authors:article.author?[article.author]:undefined,images:media?[{url:imageUrl(cmsConfig()!.url,media.storage_path),width:media.width,height:media.height,alt:article.featured_alt}]:[]},
    twitter:{card:media?'summary_large_image':'summary',title:article.seo_title||article.title,description:article.seo_description||article.excerpt},
  };
}
export default async function ArticlePage({params}:Props) {
  const {slug}=await params;if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||slug.length>140)notFound();
  const client=publicClient();if(!client)notFound();const article=await publishedArticle(slug);
  if(!article) {
    const alias=await client.from('content_slugs').select('article_id').eq('slug',slug).eq('was_published',true).maybeSingle();databaseError(alias.error);
    if(alias.data){const target=await client.from('content_articles').select('slug').eq('id',alias.data.article_id).eq('status','published').maybeSingle();databaseError(target.error);if(target.data&&target.data.slug!==slug)permanentRedirect(`/travel-advice/${target.data.slug}`);}
    notFound();
  }
  const [media,cats]=await Promise.all([publicMedia(client,article.featured_media_id),categories(client)]);
  const structured={'@context':'https://schema.org','@type':'Article',headline:article.title,description:article.excerpt,
    author:{'@type':'Person',name:article.author},datePublished:article.published_at||undefined,dateModified:article.updated_at,
    mainEntityOfPage:article.canonical_url||`${publicOrigin()}/travel-advice/${article.slug}`,image:media?imageUrl(cmsConfig()!.url,media.storage_path):undefined};
  return <main id="main-content" tabIndex={-1} className="article-page"><p className="article-back"><Link href="/travel-advice">← All travel articles</Link></p>
    <ArticleView article={article} media={media} mediaBase={cmsConfig()!.url} category={cats.find(cat=>cat.id===article.category_id)?.name}/>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structured).replace(/</g,'\\u003c')}}/>
  </main>;
}
