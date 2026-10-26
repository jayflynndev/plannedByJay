import Link from "next/link";
import { SiteImage } from "@/components/ui/SiteImage";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { offersCopy as copy } from "@/content/offers";
import { money,averagePrice,displayedSash,travelLabels,offerListHref,type PublicOffer,type OfferQuery } from "@/lib/offers/schema";
import { OfferEnquiryForm,AskJayLink } from "./OfferEnquiryForm";
export const checkedDate=(date:string)=>new Intl.DateTimeFormat("en-GB",{dateStyle:"medium",timeZone:"UTC"}).format(new Date(date+"T00:00:00Z"));
function Price({offer:o}:{offer:PublicOffer}) {
  const average=averagePrice(o);
  return <div className="offer-pricing"><p className="offer-price">{o.total_price_minor?money(o.total_price_minor,o.currency):"Price not entered"} <small>total for the stated party</small></p>
    <p>{o.adults} {o.adults===1?"adult":"adults"}{o.children?`, ${o.children} ${o.children===1?"child":"children"}${o.child_ages.length?` (ages ${o.child_ages.join(", ")})`:""}`:""} · {o.adults+o.children} priced travellers</p>
    {average&&<p>Average {money(average,o.currency)} per adult</p>}
    {o.mandatory_charges&&<p className="offer-charges">{o.mandatory_charges}</p>}
    {o.price_checked_on&&<p>Price checked: {checkedDate(o.price_checked_on)}</p>}
    {o.booking_deadline&&<p>Book by: {checkedDate(o.booking_deadline)} (UK date)</p>}
    <p>{copy.disclaimer}</p>
  </div>;
}
function Protection({offer:o}:{offer:PublicOffer}) {
  if(o.protection==="supplier-atol")return <div className="offer-disclosures"><p>ATOL holder for this advertised arrangement: {o.supplier.atol_holder} · ATOL {o.supplier.atol_number}</p>{o.protection_note&&<p>{o.protection_note}</p>}</div>;
  return o.protection==="other" && o.protection_note?<p className="offer-disclosures">{o.protection_note}</p>:null;
}
function Operator({offer:o}:{offer:PublicOffer}) {
  const s=o.supplier;
  return <div className="offer-disclosures"><p>Supplied by <strong>{s.name}</strong>{s.legal_name&&s.legal_name!==s.name?` · ${s.legal_name}`:""}</p><p>{s.business_address}</p>
    <p>{s.contact_email&&<a href={`mailto:${s.contact_email}`}>{s.contact_email}</a>}{s.contact_email&&s.contact_url?" · ":""}{s.contact_url&&<a href={s.contact_url} rel="noopener noreferrer">Supplier contact page</a>}</p>
    {s.booking_conditions_url&&<p><a href={s.booking_conditions_url} rel="noopener noreferrer">Supplier booking conditions</a></p>}
  </div>;
}
export function OfferGrid({offers}:{offers:PublicOffer[]}) {
  return <div className="offer-grid">{offers.map(o=><article className="offer-card" key={o.id}>
    <Link href={`/holiday-offers/${o.slug}`}><div className="card-photo"><SiteImage src={o.image} alt={o.featured_alt} fill sizes="(max-width:767px) 100vw,33vw" fallback={<span className="article-photo-fallback">{o.country}</span>}/>{displayedSash(o)&&<span className="offer-sash">{displayedSash(o)}</span>}</div></Link>
    <div className="offer-card-copy"><p className="eyebrow">{[o.country,o.resort].filter(Boolean).join(" · ")}</p><h3><Link href={`/holiday-offers/${o.slug}`}>{o.title}</Link></h3>{o.accommodation&&<p>{o.accommodation}</p>}
      <p>{o.departure_date&&checkedDate(o.departure_date)}{o.departure_point?` · From ${o.departure_point}`:""}{o.nights?` · ${o.nights} nights`:""}</p>
      {o.board_basis&&<p>{o.board_basis}</p>}{o.why_jay&&<p><strong>Why Jay picked it:</strong> {o.why_jay}</p>}
      <Price offer={o}/><Operator offer={o}/><Protection offer={o}/>
      <Link className="article-read-label" href={`/holiday-offers/${o.slug}`}>View Holiday Details ↗</Link>
    </div>
  </article>)}</div>;
}
export function OfferSection({offers,title,type}:{offers:PublicOffer[];title:string;type?:string}) {
  if(!offers.length)return null;
  return <section className="section offer-section"><Container><div className="section-heading"><h2>{title}</h2></div><OfferGrid offers={offers}/><p className="inspiration-action"><Button label="View Holiday Offers" href={`/holiday-offers${type?`?type=${type}`:""}`} secondary/></p></Container></section>;
}
export function OffersListing({query,offers,total,holidayTypes=[],error}:{query:OfferQuery;offers:PublicOffer[];total:number;holidayTypes?:{id:string;name:string}[];error?:string}) {
  return <main id="main-content" className="offer-page section" tabIndex={-1}><Container><header className="section-heading"><p className="eyebrow">Curated holiday offers</p><h1>{copy.title}</h1><p className="intro">{copy.description}</p></header>
    <form className="offer-filters offer-compact-filters" method="get" action="/holiday-offers" aria-label="Filter holiday offers">
      <label>Destination<input name="destination" defaultValue={query.destination} maxLength={100}/></label>
      <label>Holiday Type<select name="type" defaultValue={query.type}><option value="">All Holiday Types</option>{holidayTypes.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
      <label>Departure month<input name="month" type="month" defaultValue={query.month}/></label>
      <label>Sort by<select name="sort" defaultValue={query.sort}><option value="departure">Departure date</option><option value="price">Total price (by currency)</option></select></label>
      <div className="button-row"><button className="button" type="submit">Apply filters</button><Link className="button button-secondary" href="/holiday-offers">Reset filters</Link></div>
    </form>
    {error?<p role="status">{error}</p>:offers.length?<><p>{total} offers · Page {query.page}</p><OfferGrid offers={offers}/></>:<p>{copy.empty}</p>}
    <nav className="offer-pagination" aria-label="Offer pages">{query.page>1&&<Link href={offerListHref(query,query.page-1)}>Previous page</Link>}{query.page*12<total&&<Link href={offerListHref(query,query.page+1)}>Next page</Link>}</nav>
    <Link className="holiday-library-link" href="/holidays">Explore Holiday Types</Link>
  </Container></main>;
}
export function OfferDetail({offer:o,preview=false,privacyHref=null,enquiriesEnabled=false}:{offer:PublicOffer;preview?:boolean;privacyHref?:string|null;enquiriesEnabled?:boolean}) {
  return <div className="offer-detail"><p className="eyebrow">{o.reference}</p><h1>{o.title||"Your holiday title"}</h1><p className="intro">{o.summary}</p>
    <p>{[o.country,o.resort,o.accommodation].filter(Boolean).join(" · ")}</p>
    <div className="offer-detail-photo"><SiteImage src={o.image} alt={o.featured_alt} fill sizes="(max-width:767px) 100vw,900px"/>{displayedSash(o)&&<span className="offer-sash">{displayedSash(o)}</span>}</div>
    <AskJayLink/>
    <h2>Your holiday at a glance</h2><dl>{Object.entries({"Travel arrangement":travelLabels[o.travel_type],"Departure":o.departure_date?checkedDate(o.departure_date):"", "From":o.departure_point,"Return":o.return_date?checkedDate(o.return_date):"", "Duration":o.nights!==null?(o.nights===0?"Same-day trip":`${o.nights} nights`):"", "Board / fare":o.board_basis,"Room / cabin":o.room_type}).filter(([,v])=>v).map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
    {o.body&&<div className="article-prose" dangerouslySetInnerHTML={{__html:o.body}}/>}
    {o.why_jay&&<section><h2>Why Jay picked it</h2><p>{o.why_jay}</p></section>}
    <h2>What&apos;s included</h2><p className="offer-paragraphs">{o.inclusions}</p>{o.exclusions&&<><h2>Important exclusions and conditions</h2><p className="offer-paragraphs">{o.exclusions}</p></>}
    <h2>Price for your party</h2><Price offer={o}/><Operator offer={o}/><Protection offer={o}/>
    <details className="offer-supplier-information" open><summary>About this supplier / tour operator</summary><Operator offer={o}/><Protection offer={o}/>{o.supplier.website&&<p><a href={o.supplier.website} rel="noopener noreferrer">Supplier website</a></p>}</details>
    {o.galleryImages.length>0&&<div className="offer-gallery">{o.galleryImages.map(i=><figure key={i.src}><SiteImage src={i.src} alt={i.alt} width={800} height={600}/></figure>)}</div>}
    <p><Link href="/booking-information">Read the booking information</Link></p>
    <OfferEnquiryForm offerId={o.id} enabled={!preview&&enquiriesEnabled} privacyHref={privacyHref}/>
  </div>;
}
