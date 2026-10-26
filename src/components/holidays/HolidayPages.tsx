import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { SiteImage } from "@/components/ui/SiteImage";
import { holidayDiscovery as copy } from "@/content/holiday-types";
import type { HolidayInput } from "@/lib/holiday-types/schema";
import type { ArticlePreview } from "@/types/public-content";

export type HolidayDisplay = HolidayInput & {photoUrl: string | null};
export function HolidayGrid({holidays}: {holidays: HolidayDisplay[]}) {
  return <div className="holiday-grid">{holidays.map(item =>
    <Link className="holiday-card" key={item.slug} href={`/holidays/${item.slug}`}>
      <div className="card-photo"><SiteImage src={item.photoUrl} alt={item.image_alt} fill sizes="(max-width:479px) 100vw, (max-width:767px) 50vw, 33vw" style={{objectPosition: item.image_position}} fallback={<span className="article-photo-fallback">{copy.imageFallback}</span>}/></div>
      <div className="card-copy"><h2>{item.name}</h2><span aria-hidden="true">↗</span><p>{item.introduction}</p></div>
      <span className="article-read-label">{copy.browseLabel} {item.name} <span aria-hidden="true">↗</span></span>
    </Link>)}</div>;
}
export function HolidayLanding({holidays, unavailable = false}: {holidays: HolidayDisplay[]; unavailable?: boolean}) {
  return <main id="main-content" tabIndex={-1} className="holiday-page">
    <section className="section"><Container><header className="holiday-intro"><p className="eyebrow">{copy.title}</p><h1>Holiday Types</h1><p className="intro">{copy.description}</p><p>{copy.catalogueBody}</p><div className="button-row"><Button {...copy.catalogue}/></div></header>
      <HolidayGrid holidays={holidays}/>
      {!holidays.length && <p role={unavailable ? "status" : undefined}>{unavailable ? "Holiday Types are temporarily unavailable. Please try again shortly." : "There are no published Holiday Types at the moment."}</p>}
    </Container></section>
    <section className="section why"><Container><div className="holiday-narrow"><h2>{copy.serviceTitle}</h2><p className="intro">{copy.serviceBody}</p><Button {...copy.action}/></div></Container></section>
  </main>;
}
export function RelatedHolidayReading({articles}: {articles: ArticlePreview[]}) {
  if (!articles.length) return null;
  return <section className="section inspiration"><Container><div className="section-heading"><h2>{copy.readingTitle}</h2><p className="intro">{copy.readingBody}</p></div><div className="article-grid">{articles.map(item => <article key={item.id}><Link className="article-preview-link" href={`/travel-advice/${item.slug}`}><div className="article-photo"><SiteImage src={item.image?.src || null} alt={item.image?.alt || ""} fill sizes="(max-width:767px) 100vw,33vw" fallback={<span className="article-photo-fallback" aria-hidden="true">{item.content_type}</span>}/></div><p className="eyebrow">{item.content_type}</p><h3>{item.title}</h3><p>{item.excerpt}</p><span className="article-read-label">{copy.readLabel} <span aria-hidden="true">↗</span></span></Link></article>)}</div></Container></section>;
}

// Heading levels retain the planning/ideas grids without a second content format.
// The server sanitises all HTML before public rendering or authenticated preview.
function HolidayBody({body}: {body: string}) {
  const parts = body.split(/(?=<h2>)/);
  const firstGrid = parts.findIndex(part => part.includes("<h3>"));
  const introduction = firstGrid < 0 ? parts : parts.slice(0, firstGrid);
  const groups = firstGrid < 0 ? [] : parts.slice(firstGrid);
  return <>
    {introduction.join("") && <section className="section holiday-explanation"><Container><div className="holiday-narrow holiday-rich-text" dangerouslySetInnerHTML={{__html: introduction.join("")}}/></Container></section>}
    {groups.map((group, index) => {
      const at = group.indexOf("<h3>");
      return <section className={index === 0 ? "section why" : "section"} key={index}><Container>
        {at < 0 ? <div className="holiday-narrow holiday-rich-text" dangerouslySetInnerHTML={{__html: group}}/> : <>
          <div className="holiday-rich-text" dangerouslySetInnerHTML={{__html: group.slice(0, at)}}/>
          <div className={index === 0 ? "holiday-planning-grid" : "holiday-ideas-grid"}>
            {group.slice(at).split(/(?=<h3>)/).filter(Boolean).map((html, i) => <div className="holiday-rich-text" key={i} dangerouslySetInnerHTML={{__html: html}}/>)}</div>
        </>}
      </Container></section>;
    })}
  </>;
}
export function HolidayTypePage({holiday, others = [], articles = [], preview = false}: {holiday: HolidayDisplay; others?: HolidayDisplay[]; articles?: ArticlePreview[]; preview?: boolean}) {
  const content = <>
    <section className="section holiday-hero"><Container><Link className="holiday-back" href="/holidays">← {copy.backLabel}</Link><div className="holiday-hero-grid"><header><p className="eyebrow">{holiday.name}</p><h1>{holiday.heading || holiday.name}</h1><p className="intro">{holiday.introduction}</p><div className="button-row"><Button {...copy.action}/></div></header><div className="holiday-hero-photo"><SiteImage src={holiday.photoUrl} alt={holiday.image_alt} fill sizes="(max-width:767px) calc(100vw - 44px),45vw" style={{objectPosition: holiday.image_position}} fallback={<span className="article-photo-fallback">{copy.imageFallback}</span>}/></div></div></Container></section>
    <HolidayBody body={holiday.body}/>
    <RelatedHolidayReading articles={articles}/>
    <section className="section holiday-further"><Container><Link className="holiday-library-link" href="/travel-advice">{copy.readingLink} <span aria-hidden="true">↗</span></Link>{others.length > 0 && <nav aria-label={copy.alsoTitle}><h2>{copy.alsoTitle}</h2><div className="button-row">{others.map(item => <Button key={item.slug} label={item.name} href={`/holidays/${item.slug}`} secondary/>)}</div></nav>}</Container></section>
    {/* Future published offers can be inserted here. No offer system or empty section exists. */}
    <section className="section cta"><Container><h2>{holiday.closing_heading}</h2><p className="intro">{holiday.closing_body}</p><Button {...copy.action}/></Container></section>
  </>;
  return preview ? <div className="holiday-page">{content}</div> : <main id="main-content" tabIndex={-1} className="holiday-page">{content}</main>;
}
