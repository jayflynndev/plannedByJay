import Link from 'next/link';
import { SiteImage } from '@/components/ui/SiteImage';
import type { ArticlePreview } from '@/types/public-content';
import { Button } from '@/components/ui/Button';
import { home } from '@/content/home';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
/** Real published previews only. Empty/unavailable libraries add no sample content. */
export function TravelInspiration({articles}:{articles:ArticlePreview[]}) {
  if(!articles.length)return null;
  return <section id="inspiration" className="section inspiration"><Container><SectionHeading {...home.inspiration}/>
    <div className="article-grid">{articles.map(item=><article key={item.id}><Link className="article-preview-link" href={`/travel-advice/${item.slug}`}>
      <div className="article-photo"><SiteImage src={item.image?.src||null} alt={item.image?.alt||''} fill sizes="(max-width: 767px) 100vw, 33vw" fallback={<span className="article-photo-fallback" aria-hidden="true">{item.content_type}</span>}/></div>
      <p className="eyebrow">{item.content_type}</p><h3>{item.title}</h3><p>{item.excerpt}</p><span className="article-read-label">Read article <span aria-hidden="true">↗</span></span>
    </Link></article>)}</div><div className="inspiration-action"><Button {...home.inspiration.action} secondary/></div>
  </Container></section>;
}
