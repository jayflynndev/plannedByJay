import type { Metadata } from 'next';
import { holidayDiscovery, type HolidayType } from '@/content/holiday-types';
/** Metadata remains subject to RootLayout's existing indexing gate. */
export function holidayMetadata(origin:string,holiday?:HolidayType):Metadata {
  const title=holiday?.title||holidayDiscovery.title;
  const description=holiday?.description||holidayDiscovery.description;
  const url=`${origin}/holidays${holiday?`/${holiday.slug}`:''}`;
  return {title:`${title} | Planned by Jay`,description,alternates:{canonical:url},openGraph:{title,description,url,type:'website',...(holiday?{images:[{url:`${origin}${holiday.image.src}`,alt:holiday.image.alt}]}:{})}};
}
