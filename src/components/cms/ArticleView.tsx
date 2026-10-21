import Image from 'next/image';
import { Markdown } from './Markdown';
import { cmsCopy } from '@/content/cms';
import type { Media } from '@/lib/cms/schema';
import { imageUrl } from '@/lib/cms/urls';
export type ArticleDisplay = {title:string;excerpt:string;body:string;author:string;content_type:string;featured_alt:string;published_at?:string|null;updated_at?:string;fact_checked_date?:string|null};
export function ArticleView({article,media,mediaBase,category}:{article:ArticleDisplay;media:Media|null;mediaBase:string;category?:string}) {
  return <article className="article-view">
    <header><p className="eyebrow">{category||article.content_type}</p><h1>{article.title||'Your article title'}</h1><p className="article-excerpt">{article.excerpt}</p>
      <div className="article-byline">{article.author&&<span>By {article.author}</span>}{article.published_at&&<span>Published <time dateTime={article.published_at}>{displayDate(article.published_at)}</time></span>}
        {article.updated_at&&<span>Updated <time dateTime={article.updated_at}>{displayDate(article.updated_at)}</time></span>}{article.fact_checked_date&&<span>Fact-checked <time dateTime={article.fact_checked_date}>{displayDate(article.fact_checked_date)}</time></span>}</div>
    </header>
    {media&&<Image className="article-featured" src={imageUrl(mediaBase,media.storage_path)} alt={article.featured_alt} width={media.width} height={media.height} sizes="(max-width: 900px) 100vw, 900px"/>}
    <Markdown body={article.body} mediaBase={mediaBase}/>
    <aside className="article-cta"><h2>{cmsCopy.ctaTitle}</h2><p>{cmsCopy.ctaBody}</p><a className="button" href="/plan-my-holiday">Plan My Holiday <span aria-hidden="true">↗</span></a></aside>
  </article>;
}
function displayDate(date:string) {return new Date(date).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'});}
