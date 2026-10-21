import type { Metadata } from 'next';
import { whyJay } from '@/content/why-jay';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { SiteImage } from '@/components/ui/SiteImage';
import { publicOrigin } from '@/lib/cms/config';
export function generateMetadata():Metadata {return {title:`${whyJay.title} | Planned by Jay`,description:whyJay.description,alternates:{canonical:`${publicOrigin()}/why-jay`},openGraph:{title:whyJay.title,description:whyJay.description,url:`${publicOrigin()}/why-jay`,type:'website'}};}
export default function WhyJayPage() {
  return <main id="main-content" tabIndex={-1} className="why-page"><section className="section why-page-intro"><Container className="why-page-intro-grid"><div><p className="eyebrow">{whyJay.eyebrow}</p><h1>{whyJay.title}</h1><div className="intro">{whyJay.introduction.map(paragraph=><p key={paragraph}>{paragraph}</p>)}</div></div><div className="why-page-portrait"><SiteImage src={whyJay.portrait.src} alt={whyJay.portrait.alt} fill sizes="(max-width: 767px) calc(100vw - 44px), 380px" style={{objectPosition: whyJay.portrait.objectPosition}} /></div></Container></section>
    <section className="section why-page-background"><Container><h2>{whyJay.backgroundTitle}</h2>{whyJay.background.map(paragraph=><p key={paragraph}>{paragraph}</p>)}</Container></section>
    <section className="section why"><Container><h2>{whyJay.prioritiesTitle}</h2><div className="intro">{whyJay.prioritiesIntro.map(paragraph=><p key={paragraph}>{paragraph}</p>)}</div><div className="priorities-grid">{whyJay.priorities.map(point=><div key={point.title}><h3>{point.title}</h3><p>{point.body}</p></div>)}</div></Container></section>
    <section className="section"><Container><h2>{whyJay.journeyTitle}</h2><ol className="journey-steps">{whyJay.steps.map((step,index)=><li key={step.title}><span aria-hidden="true">{String(index+1).padStart(2,'0')}</span><div><h3>{step.title}</h3>{step.paragraphs.map(paragraph=><p key={paragraph}>{paragraph}</p>)}</div></li>)}</ol></Container></section>
    <section className="section cta"><Container><h2>{whyJay.ctaTitle}</h2><p className="intro">{whyJay.ctaBody}</p><Button {...whyJay.cta}/></Container></section>
  </main>;
}
