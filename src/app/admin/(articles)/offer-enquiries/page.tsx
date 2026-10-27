import {pageAdmin,ArticleError} from "@/lib/articles/client";
import {money} from "@/lib/offers/schema";
import {notificationNeedsReview,storedOfferReference,type StoredOfferEnquiry} from "@/lib/offers/enquiries";
import {RetryOfferNotification} from "@/components/offers/RetryOfferNotification";

export default async function OfferEnquiries({searchParams}:{searchParams:Promise<{view?:string;page?:string}>}) {
  const client=await pageAdmin(),params=await searchParams;
  const all=params.view==="all",page=Math.max(1,Math.min(1000,Math.trunc(Number(params.page)||1)));
  let query=client.from("offer_enquiries").select("id,name,email,phone,message,created_at,offer_snapshot,notification_id,notified_at,offer:holiday_offers(reference)",{count:"exact"}).order("created_at",{ascending:false}).order("id").range((page-1)*25,page*25-1);
  if(!all)query=query.is("notification_id",null);
  const result=await query;
  if(result.error)throw new ArticleError("Offer enquiries could not be loaded. No records were changed.",503);
  const rows=(result.data||[]) as unknown as StoredOfferEnquiry[];
  const date=(value:string)=>new Intl.DateTimeFormat("en-GB",{dateStyle:"medium",timeStyle:"short",timeZone:"Europe/London"}).format(new Date(value));
  return <><h1>Offer enquiries</h1><p>Enquiries are securely retained here. Pending means the email notification has not been confirmed; it may have failed or its receipt may be missing. Accepted by Resend does not confirm mailbox arrival.</p>
    <nav aria-label="Enquiry views"><a href="/admin/offer-enquiries">Pending notifications</a><a href="/admin/offer-enquiries?view=all">All enquiries</a></nav>
    <ul className="article-admin-list">{rows.map(enquiry=>{
      const snapshot=enquiry.offer_snapshot;
      const partyPrice=typeof snapshot.total_price_minor==="number"&&["GBP","EUR","USD"].includes(String(snapshot.currency))?money(snapshot.total_price_minor,String(snapshot.currency)):"Price details unavailable";
      let reference="Unavailable";try{reference=storedOfferReference(enquiry);}catch{}
      return <li key={enquiry.id}><h2>{String(snapshot.title||"Saved holiday enquiry")}</h2><p><strong>Offer reference: {reference}</strong> · {String((snapshot.supplier as {name?:string})?.name||"")}</p>
        <p>Departure: {String(snapshot.departure_date||"Not specified")} · {partyPrice}{typeof snapshot.total_price_minor==="number"?" total":""} · {String(snapshot.adults??"")} {snapshot.adults===1?"adult":"adults"}{snapshot.children?` + ${snapshot.children} ${snapshot.children===1?"child":"children"}`:""}</p>
        <p>Received {date(enquiry.created_at)} (Europe/London)</p><p><strong>{enquiry.name}</strong> · <a href={`mailto:${enquiry.email}`}>{enquiry.email}</a>{enquiry.phone?` · ${enquiry.phone}`:""}</p>{enquiry.message&&<p className="offer-enquiry-message">{enquiry.message}</p>}
        <p className="offer-enquiry-record">Internal enquiry ID: {enquiry.id}</p>
        {enquiry.notification_id?<p>Notification accepted by Resend{enquiry.notified_at?` · ${date(enquiry.notified_at)}`:""}. Receipt: {enquiry.notification_id}</p>:<><p><strong>Notification pending or unconfirmed</strong></p><RetryOfferNotification id={enquiry.id} needsReview={notificationNeedsReview(enquiry.created_at)}/></>}
      </li>;
    })}</ul>{!rows.length&&<p>{all?"No enquiries have been stored.":"No pending notifications."}</p>}
    <nav aria-label="Enquiry pages">{page>1&&<a href={"?"+new URLSearchParams({view:all?"all":"pending",page:String(page-1)})}>Previous page</a>}{page*25<(result.count||0)&&<a href={"?"+new URLSearchParams({view:all?"all":"pending",page:String(page+1)})}>Next page</a>}</nav>
  </>;
}
