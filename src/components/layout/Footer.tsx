import Link from 'next/link';
import { site } from '@/content/site';
import { navigation, primaryNavigation } from '@/content/navigation';
import { Container } from '@/components/ui/Container';
import { TrustInformation } from './TrustInformation';
import { approvedPolicies } from '@/content/policies';
/** Footer settings and approved business details: src/content/site.ts. */
export function Footer() {
  return <footer className="footer"><Container><div className="footer-grid">
    <div><Link href="/" className="brand"><span>{site.name}<i aria-hidden="true">.</i></span></Link><p>{site.footerIntro}</p></div>
    <nav aria-label="Footer navigation">{[...navigation, primaryNavigation].map(item => <Link key={item.label} href={item.href}>{item.label}</Link>)}</nav>
    <div><h2>Get in touch</h2>{site.contact.email && <a className="footer-contact" href={`mailto:${site.contact.email}`}>{site.contact.email}</a>}{site.contact.phone && <a href={`tel:${site.contact.phone.replace(/\s/g, '')}`}>{site.contact.phone}</a>}{site.social.length>0&&<nav className="footer-social" aria-label="Social profiles">{site.social.map(item => <a key={item.label} href={item.href}>{item.label}</a>)}</nav>}</div>
  </div><TrustInformation/><div className="footer-bottom"><small>© {new Date().getFullYear()} {site.copyright}</small><div className="footer-policies">{[...approvedPolicies(),...site.policies].map(item => <Link key={item.href} href={item.href}>{item.label}</Link>)}</div></div></Container></footer>;
}
