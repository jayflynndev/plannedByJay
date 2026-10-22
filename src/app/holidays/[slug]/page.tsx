import { notFound } from 'next/navigation';
import { holidayType } from '@/content/holiday-types';
import { HolidayTypePage } from '@/components/holidays/HolidayPages';
import { holidayMetadata } from '@/lib/holiday-metadata';
import { publicClient } from '@/lib/cms/client';
import { publicOrigin, cmsConfig } from '@/lib/cms/config';
import { holidayReading } from '@/lib/cms/holiday-reading';
import type { ArticlePreview } from '@/lib/cms/previews';
export const dynamic='force-dynamic';
type Props={params:Promise<{slug:string}>};
export async function generateMetadata({params}:Props){const item=holidayType((await params).slug);if(!item)notFound();return holidayMetadata(publicOrigin(),item);}
export default async function HolidayPage({params}:Props){
  const item=holidayType((await params).slug);if(!item)notFound();
  let articles:ArticlePreview[]=[];
  try {articles=await holidayReading(publicClient(),cmsConfig()?.url||'',item.related);}
  catch {console.warn('holiday_reading_unavailable');}
  return <HolidayTypePage holiday={item} articles={articles}/>;
}
