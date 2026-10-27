import { pageAdmin } from "@/lib/articles/client";
import { offerError } from "@/lib/offers/data";
import { money } from "@/lib/offers/schema";
import { OfferActions } from "@/components/offers/OfferActions";
import { OfferReference } from "@/components/offers/OfferReference";
export default async function OfferDashboard({searchParams}:{searchParams:Promise<{q?:string;page?:string}>}) {
  const client=await pageAdmin(),params=await searchParams;
  const q=typeof params.q==="string"?params.q.slice(0,120):"",page=Math.max(1,Math.min(1000,Math.trunc(Number(params.page)||1)));
  let query=client.from("holiday_offers").select("id,reference,previous_reference,title,country,resort,departure_date,total_price_minor,currency,status,archived,version,suppliers(name)",{count:"exact"}).order("updated_at",{ascending:false}).order("id").range((page-1)*25,page*25-1);
  if(/^[0-9]{6}$/.test(q))query=query.or('reference.eq.'+q+',previous_reference.eq.'+q);
  else if(q)query=query.ilike("title","%"+q.replace(/[\\%_*]/g,"")+"%");
  const r=await query;offerError(r.error);
  return <><div className="article-admin-heading"><h1>Holiday Offers</h1><a className="button" href="/admin/holiday-offers/new">Add Offer</a></div><form method="get"><label>Search offers by title or reference<input name="q" defaultValue={q} maxLength={120}/></label><button className="button button-secondary" type="submit">Search</button></form>
    <ul className="article-admin-list">{r.data?.map(o=><li key={o.id}><h2>{o.title||"Untitled draft"}</h2><OfferReference reference={o.reference}/>{o.previous_reference&&<p>Earlier customer reference (still valid): {o.previous_reference}</p>}<p>{(o.suppliers as unknown as {name:string}|null)?.name||"No supplier selected"} · {[o.country,o.resort].filter(Boolean).join(", ")}</p><p>{o.departure_date||"No departure date"} · {o.total_price_minor?money(o.total_price_minor,o.currency):"No price"} · {o.status==="published"?"Published":"Draft"}{o.archived?" · Archived":""}</p><OfferActions offer={o}/></li>)}</ul>{!r.data?.length&&<p>No offers match this search. Add an offer or clear the search.</p>}
    <nav aria-label="Offer list pages">{page>1&&<a href={"?"+new URLSearchParams({q,page:String(page-1)})}>Previous page</a>}{page*25<(r.count||0)&&<a href={"?"+new URLSearchParams({q,page:String(page+1)})}>Next page</a>}</nav>
  </>;
}
