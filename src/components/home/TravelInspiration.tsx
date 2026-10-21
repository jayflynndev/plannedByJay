import Image from 'next/image';
import { home } from '@/content/home';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
/** Sample editorial previews: src/content/home.ts → inspiration. No unpublished article links. */
export function TravelInspiration() { return <section id="inspiration" className="section inspiration"><Container><SectionHeading {...home.inspiration}/><div className="article-grid">{home.inspiration.items.map(item => <article key={item.title}><div className="article-photo"><Image src={item.image} alt={item.alt} fill sizes="(max-width: 767px) 100vw, 33vw"/></div><p className="eyebrow">{item.category}</p><h3>{item.title}</h3><p>{item.description}</p><small className="sample-label">{home.inspiration.sampleLabel}</small></article>)}</div></Container></section>; }
