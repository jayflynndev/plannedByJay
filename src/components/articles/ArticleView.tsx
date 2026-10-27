import Image from "next/image";

import { articleCopy } from "@/content/articles";
import type { ImageAsset } from "@/types/public-content";
import {articleBodyForDisplay} from '@/lib/article-presentation';
import {imageDescription} from '@/content/image-descriptions';

export type ArticleDisplay = {
  title: string;
  excerpt: string;
  body: string;
  author: string;
  content_type: string;
  featured_alt: string;
  published_at?: string | null;
  updated_at?: string;
  fact_checked_date?: string | null;
};
// Callers supply HTML sanitised by the server for public reads or authenticated preview.
export function ArticleView({
  article,
  media,
  category,
}: {
  article: ArticleDisplay;
  media: ImageAsset | null;
  category?: string;
}) {
  return (
    <article className="article-view">
      <header>
        <p className="eyebrow">{category || article.content_type}</p>
        <h1>{article.title || "Your article title"}</h1>
        <p className="article-excerpt">{article.excerpt}</p>
        <div className="article-byline">
          {article.author && <span>By {article.author}</span>}
          {article.published_at && (
            <span>
              Published{" "}
              <time dateTime={article.published_at}>
                {displayDate(article.published_at)}
              </time>
            </span>
          )}
          {article.updated_at && (
            <span>
              Updated{" "}
              <time dateTime={article.updated_at}>
                {displayDate(article.updated_at)}
              </time>
            </span>
          )}
          {article.fact_checked_date && (
            <span>
              Fact-checked{" "}
              <time dateTime={article.fact_checked_date}>
                {displayDate(article.fact_checked_date)}
              </time>
            </span>
          )}
        </div>
      </header>
      {media && (
        <Image
          className="article-featured"
          src={media.src}
          alt={imageDescription(media.src,article.featured_alt)}
          width={media.width}
          height={media.height}
          sizes="(max-width: 900px) 100vw, 900px"
        />
      )}
      <div
        className="article-prose"
        dangerouslySetInnerHTML={{ __html: articleBodyForDisplay(article.body,article.title) }}
      />
      <aside className="article-cta">
        <h2>{articleCopy.ctaTitle}</h2>
        <p>{articleCopy.ctaBody}</p>
        <a className="button" href="/plan-my-holiday">
          Plan My Holiday <span aria-hidden="true">↗</span>
        </a>
      </aside>
    </article>
  );
}
function displayDate(date: string) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
