import { notFound } from "next/navigation";
import { HolidayTypePage } from "@/components/holidays/HolidayPages";
import { publicHoliday, publicHolidayTypes, holidayPhoto } from "@/lib/holiday-types/data";
import { holidayMetadata } from "@/lib/holiday-metadata";
import { publicOrigin } from "@/lib/presentation";
import { publicOffers } from "@/lib/offers/data";
import { emptyOfferQuery } from "@/lib/offers/schema";
import {relatedHolidays} from '@/lib/related-holidays';
export const dynamic = "force-dynamic";
type Props = {params: Promise<{slug: string}>};
export async function generateMetadata({params}: Props) {
  const holiday = await publicHoliday((await params).slug);
  if (!holiday) notFound();
  return holidayMetadata(publicOrigin(), {...holiday, photoUrl: holidayPhoto(holiday.image)});
}
export default async function HolidayPage({params}: Props) {
  const holiday = await publicHoliday((await params).slug);
  if (!holiday) notFound();
  let others: Awaited<ReturnType<typeof publicHolidayTypes>> = [];
  try { others = relatedHolidays(holiday.slug,await publicHolidayTypes()); }
  catch { /* Related links are optional when the catalogue is unavailable. */ }
  const related=await publicOffers({...emptyOfferQuery,type:holiday.id},{limit:6}).catch(()=>({offers:[],total:0}));
  return <HolidayTypePage holiday={{...holiday, photoUrl: holidayPhoto(holiday.image)}} others={others.map(h => ({...h, photoUrl: holidayPhoto(h.image)}))} offers={related.offers}/>;
}
