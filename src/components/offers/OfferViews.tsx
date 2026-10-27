import Link from "next/link";
import { SiteImage } from "@/components/ui/SiteImage";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { offersCopy as copy } from "@/content/offers";
import { money,averagePrice,displayedSash,travelLabels,offerListHref,type PublicOffer,type OfferQuery } from "@/lib/offers/schema";
import { OfferEnquiryForm,AskJayLink } from "./OfferEnquiryForm";
import { OfferReference } from "./OfferReference";
import { OfferGallery } from "./OfferGallery";
import { cardBenefit,cardReason,inclusionItems } from "@/lib/offers/presentation";
export const checkedDate=(date:string)=>new Intl.DateTimeFormat("en-GB",{dateStyle:"medium",timeZone:"UTC"}).format(new Date(date+"T00:00:00Z"));
function Price({offer:o}:{offer:PublicOffer}) {
  const average=averagePrice(o);
  return <div className="offer-pricing"><p className="offer-price">{o.total_price_minor?money(o.total_price_minor,o.currency):"Price not entered"} <small>total for the stated party</small></p>
    <p className="offer-party">{o.adults} {o.adults===1?"adult":"adults"}{o.children?` + ${o.children} ${o.children===1?"child":"children"}${o.child_ages.length?` (ages ${o.child_ages.join(", ")})`:""}`:""}</p>
    {average&&<p>Average {money(average,o.currency)} per adult</p>}
    {o.mandatory_charges&&<p className="offer-charges">{o.mandatory_charges}</p>}
    {o.price_checked_on&&<p>Price checked: {checkedDate(o.price_checked_on)}</p>}
    {o.booking_deadline&&<p>Book by: {checkedDate(o.booking_deadline)} (UK date)</p>}
    <p className="offer-availability-note">Prices and availability may change.</p>
  </div>;
}
function Protection({offer:o}:{offer:PublicOffer}) {
  if(o.protection==="supplier-atol")return <div className="offer-disclosures"><p>ATOL holder for this advertised arrangement: {o.supplier.atol_holder} · ATOL {o.supplier.atol_number}</p>{o.protection_note&&<p>{o.protection_note}</p>}</div>;
  return o.protection==="other" && o.protection_note?<p className="offer-disclosures">{o.protection_note}</p>:null;
}
function Operator({offer:o}:{offer:PublicOffer}) {
  const s=o.supplier;
  return <div className="offer-disclosures"><p>Supplied by <strong>{s.name}</strong>{s.legal_name&&s.legal_name!==s.name?` · ${s.legal_name}`:""}</p>{s.business_address&&<p>{s.business_address}</p>}
    {(s.contact_email||s.contact_url)&&<p>{s.contact_email&&<a href={`mailto:${s.contact_email}`}>{s.contact_email}</a>}{s.contact_email&&s.contact_url?" · ":""}{s.contact_url&&<a href={s.contact_url} rel="noopener noreferrer">Supplier contact page</a>}</p>}
    {s.booking_conditions_url&&<p><a href={s.booking_conditions_url} rel="noopener noreferrer">Supplier booking conditions</a></p>}
  </div>;
}
export function OfferGrid({offers}:{offers:PublicOffer[]}) {
  return <div className="offer-grid">{offers.map(o=><article className="offer-card" key={o.id}>
    <Link className="offer-card-photo" href={`/holiday-offers/${o.slug}`} aria-label={`View ${o.title}`}><div className="card-photo"><SiteImage src={o.image} alt={o.featured_alt} fill sizes="(max-width:767px) 100vw,(max-width:1023px) 38vw,350px" fallback={<span className="article-photo-fallback">{o.country}</span>}/>{displayedSash(o)&&<span className="offer-sash">{displayedSash(o)}</span>}</div></Link>
    <div className="offer-card-copy"><p className="eyebrow">{[o.country,o.resort].filter(Boolean).join(" · ")}</p><h3><Link href={`/holiday-offers/${o.slug}`}>{o.title}</Link></h3>{o.accommodation&&<p>{o.accommodation}</p>}
      <ul className="offer-card-facts">
        {o.departure_date&&<li><time dateTime={o.departure_date}>{checkedDate(o.departure_date)}</time></li>}
        {o.nights!==null&&<li>{o.nights===0?"Same-day trip":`${o.nights} ${o.nights===1?"night":"nights"}`}</li>}
        {o.departure_point&&<li>From {o.departure_point}</li>}{o.board_basis&&<li>{o.board_basis}</li>}
      </ul>
      {cardBenefit(o)&&<p className="offer-card-benefit">{cardBenefit(o)}</p>}
      {o.why_jay&&<p className="offer-card-why"><strong>Why Jay picked it:</strong> {cardReason(o.why_jay)}</p>}
      <p className="offer-card-supplier">Supplied by <strong>{o.supplier.name}</strong></p><OfferReference reference={o.reference}/>
    </div>
    <div className="offer-card-price">
      <div>
      <p className="offer-price">{o.total_price_minor?money(o.total_price_minor,o.currency):"Price not entered"}{o.total_price_minor&&<span> total</span>}</p>
      <p>{o.adults} {o.adults===1?"adult":"adults"}{o.children?` + ${o.children} ${o.children===1?"child":"children"}${o.child_ages.length?` (ages ${o.child_ages.join(", ")})`:""}`:""}</p>
      {averagePrice(o)&&<p className="offer-card-note">Average {money(averagePrice(o),o.currency)} per adult</p>}
      {o.mandatory_charges&&<p className="offer-charges">{o.mandatory_charges}</p>}
      {o.booking_deadline&&<p className="offer-card-note">Book by {checkedDate(o.booking_deadline)}</p>}
      {o.price_checked_on&&<p className="offer-card-note">Price checked {checkedDate(o.price_checked_on)}</p>}
      <p className="offer-card-note">Prices and availability may change.</p>
      </div>
      <Link className="button" href={`/holiday-offers/${o.slug}`}>View Holiday <span aria-hidden="true">↗</span></Link>
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
  const photos=[...(o.image?[{src:o.image,alt:o.featured_alt}]:[]),...o.galleryImages].filter((photo,index,all)=>all.findIndex(p=>p.src===photo.src)===index);
  const included=inclusionItems(o.inclusions),available=!preview&&enquiriesEnabled&&!!privacyHref;
  const hasBody=!!o.body.replace(/<[^>]*>/g,"").replace(/&nbsp;|&#160;|&#xA0;/gi," ").trim();
  const facts=Object.entries({"Travel arrangement":travelLabels[o.travel_type],"Departure":o.departure_date?checkedDate(o.departure_date):"", "Return":o.return_date?checkedDate(o.return_date):"", "Nights":o.nights!==null?(o.nights===0?"Same-day trip":String(o.nights)):"", "Departing from":o.departure_point,"Board / fare":o.board_basis,"Room / cabin":o.room_type}).filter(([,value])=>value);
  return <div className="offer-detail">
    <header className="offer-detail-heading"><h1>{o.title||"Your holiday title"}</h1>{o.accommodation&&<p className="offer-accommodation">{o.accommodation}</p>}{(o.country||o.resort)&&<p className="offer-destination">{[o.country,o.resort].filter(Boolean).join(" · ")}</p>}{o.summary&&<p className="intro">{o.summary}</p>}</header>
    <OfferGallery photos={photos} sash={displayedSash(o)}/>
    <section className="offer-summary" aria-label="Holiday summary and price">
      <div className="offer-price-panel"><h2>Price for your party</h2><Price offer={o}/><p>Supplied by <strong>{o.supplier.name}</strong></p><OfferReference reference={o.reference}/><AskJayLink/>{!available&&<p className="offer-enquiry-unavailable">Online enquiries are currently unavailable.</p>}</div>
      <div className="offer-summary-facts"><h2>Your holiday at a glance</h2><dl>{facts.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></div>
    </section>
    <div className="offer-detail-content">
      {hasBody&&<section className="offer-description" aria-labelledby="offer-description-heading"><h2 id="offer-description-heading">About this holiday</h2><div className="article-prose" dangerouslySetInnerHTML={{__html:o.body}}/></section>}
      {o.inclusions.trim()&&<section className="offer-inclusions" aria-labelledby="offer-inclusions-heading"><h2 id="offer-inclusions-heading">What&apos;s included</h2>{included?<ul className="offer-inclusion-list">{included.map((item,index)=><li key={index}>{item}</li>)}</ul>:<p className="offer-paragraphs">{o.inclusions}</p>}</section>}
      {o.why_jay.trim()&&<section className="offer-editorial" aria-labelledby="offer-why-heading"><p className="eyebrow">A personal selection</p><h2 id="offer-why-heading">Why Jay picked it</h2><p className="offer-paragraphs">{o.why_jay}</p></section>}
      {o.exclusions.trim()&&<section aria-labelledby="offer-conditions-heading"><h2 id="offer-conditions-heading">Important conditions and exclusions</h2><p className="offer-paragraphs">{o.exclusions}</p></section>}
      <section className="offer-supplier-section" aria-labelledby="offer-supplier-heading"><h2 id="offer-supplier-heading">Supplier and price information</h2><p>{copy.disclaimer}</p><details className="offer-supplier-information"><summary>Supplier details and booking conditions</summary><Operator offer={o}/><Protection offer={o}/>{o.supplier.website&&<p><a href={o.supplier.website} rel="noopener noreferrer">Supplier website</a></p>}</details><p><Link href="/booking-information">Read the booking information</Link></p></section>
      <OfferEnquiryForm offerId={o.id} summary={{reference:o.reference,title:o.title,supplier:o.supplier.name,departure_date:o.departure_date,total_price_minor:o.total_price_minor,currency:o.currency,adults:o.adults,children:o.children,child_ages:o.child_ages}} enabled={available} privacyHref={privacyHref}/>
    </div>
  </div>;
}
