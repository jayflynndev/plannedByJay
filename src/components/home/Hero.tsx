import { SiteImage } from '@/components/ui/SiteImage';
import { home } from '@/content/home';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
/** Presentation only. Edit hero copy and photography in src/content/home.ts. */
export function Hero() {
  const content = home.hero;
  return <section className="hero"><Container className="hero-grid"><div className="hero-copy"><p className="eyebrow">{content.eyebrow}</p><h1>{content.headline}</h1><p className="intro">{content.description}</p><div className="button-row"><Button {...content.primary}/><Button {...content.secondary} secondary/></div><p className="hero-note"><span aria-hidden="true">✳</span>{content.note}</p></div><figure className="hero-photo"><SiteImage src={content.image} alt={content.imageAlt} fill sizes="(max-width: 767px) 100vw, 50vw" priority/><figcaption>{content.caption}</figcaption><span className="photo-stamp" aria-hidden="true">Let’s go<br/>somewhere.</span></figure></Container></section>;
}
