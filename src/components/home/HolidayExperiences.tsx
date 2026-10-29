import { SiteImage } from "@/components/ui/SiteImage";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { home } from "@/content/home";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { HolidayDisplay } from "@/components/holidays/HolidayPages";
export function HolidayExperiences({holidays}: {holidays: HolidayDisplay[]}) {
  if (!holidays.length) return null;
  return <section id="holidays" className="section"><Container><SectionHeading {...home.holidays}/><div className="holiday-grid">{holidays.slice(0, 3).map(item => <Link className="holiday-card" key={item.slug} href={`/holidays/${item.slug}`} aria-label={`${home.holidays.actionLabel}: ${item.name}`}><div className="card-photo"><SiteImage src={item.photoUrl} alt={item.image_alt} fill sizes="(max-width:639px) 100vw, (max-width:1023px) 50vw, 33vw" style={{objectPosition: item.image_position}}/></div><div className="card-copy"><h3>{item.name}</h3><span aria-hidden="true">↗</span><p>{item.introduction}</p></div></Link>)}</div><div className="inspiration-action"><Button {...home.holidays.action} secondary/></div></Container></section>;
}
