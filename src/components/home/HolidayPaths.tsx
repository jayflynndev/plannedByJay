import Link from 'next/link';
import { home } from '@/content/home';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
/** Starting-point copy: src/content/home.ts → paths. */
export function HolidayPaths() { return <section className="section paths"><Container><SectionHeading {...home.paths}/><div className="paths-grid">{home.paths.items.map((item, index) => <div className="path" key={item.title}><span className="path-number">0{index + 1}</span><h3>{item.title}</h3><p>{item.description}</p><Link href={item.action.href}>{item.action.label}<span aria-hidden="true">↗</span></Link></div>)}</div></Container></section>; }
