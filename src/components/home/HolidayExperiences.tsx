import { SiteImage } from '@/components/ui/SiteImage';
import Link from 'next/link';
import type { Holiday } from '@/types/content';
import { home } from '@/content/home';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
function HolidayCard({ item }: { item: Holiday }) { return <Link className="holiday-card" href={home.holidays.actionHref} aria-label={`${home.holidays.actionLabel}: ${item.title}`}><div className="card-photo"><SiteImage src={item.src} alt={item.alt} fill sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"/></div><div className="card-copy"><h3>{item.title}</h3><span aria-hidden="true">↗</span><p>{item.description}</p></div></Link>; }
/** Category array, imagery and labels: src/content/home.ts → holidays. */
export function HolidayExperiences() { return <section id="holidays" className="section"><Container><SectionHeading {...home.holidays}/><div className="holiday-grid">{home.holidays.items.map(item => <HolidayCard key={item.title} item={item}/>)}</div></Container></section>; }
