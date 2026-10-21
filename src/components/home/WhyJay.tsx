import { SiteImage } from '@/components/ui/SiteImage';
import { Button } from '@/components/ui/Button';
import { home } from '@/content/home';
import { Container } from '@/components/ui/Container';
/** Personal introduction and optional genuine portrait: src/content/home.ts → why. */
export function WhyJay() { const content = home.why;const fallback=<><span className="portrait-decoration" aria-hidden="true">J.</span><p className="portrait-label">{content.portraitLabel}</p><strong>{content.portraitNote}</strong></>;return <section id="why-jay" className="section why"><Container className="why-grid"><div className="portrait"><SiteImage src={content.portrait} alt={content.portraitAlt} fill sizes="(max-width: 767px) 90vw, 35vw" style={{objectPosition:content.portraitPosition}} fallback={fallback}/></div><div><p className="eyebrow">{content.eyebrow}</p><h2>{content.title}</h2><p className="intro">{content.description}</p><ul className="benefits">{content.points.map(point => <li key={point}><span aria-hidden="true">✓</span>{point}</li>)}</ul><p>{content.closing}</p><div className="why-action"><Button {...content.action} secondary/></div></div></Container></section>; }
