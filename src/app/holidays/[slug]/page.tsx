import { notFound } from 'next/navigation';
import { holidayType } from '@/content/holiday-types';
import { HolidayTypePage } from '@/components/holidays/HolidayPages';
import { holidayMetadata } from '@/lib/holiday-metadata';
import {publicOrigin} from '@/lib/presentation';
type Props={params:Promise<{slug:string}>};
export async function generateMetadata({params}:Props){const item=holidayType((await params).slug);if(!item)notFound();return holidayMetadata(publicOrigin(),item);}
export default async function HolidayPage({params}:Props){const item=holidayType((await params).slug);if(!item)notFound();return <HolidayTypePage holiday={item}/>;}
