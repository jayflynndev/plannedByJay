import { OffersListing } from "@/components/offers/OfferViews";
import { offersCopy } from "@/content/offers";
import { publicOrigin } from "@/lib/presentation";
import { publicOffers } from "@/lib/offers/data";
import { offerQuery } from "@/lib/offers/schema";
import { publicHolidayTypes } from "@/lib/holiday-types/data";
export const dynamic="force-dynamic";
export function generateMetadata(){return {title:"Holiday Offers | Planned by Jay",description:offersCopy.description,alternates:{canonical:publicOrigin()+"/holiday-offers"}};}
export default async function HolidayOffers({searchParams}:{searchParams?:Promise<Record<string,unknown>>}={}) {
  const query=offerQuery(await searchParams),holidays=await publicHolidayTypes().catch(()=>[]);
  let result:Awaited<ReturnType<typeof publicOffers>>={offers:[],total:0},error:string|undefined;
  try{result=await publicOffers(query);}catch{error=offersCopy.unavailable;}
  return <OffersListing query={query} {...result} holidayTypes={holidays.map(h=>({id:h.id,name:h.name}))} error={error}/>;
}
