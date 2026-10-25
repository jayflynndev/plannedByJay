import { HolidayLanding } from '@/components/holidays/HolidayPages';
import { holidayMetadata } from '@/lib/holiday-metadata';
import { publicOrigin } from '@/lib/presentation';
export function generateMetadata(){return holidayMetadata(publicOrigin());}
export default function Holidays(){return <HolidayLanding/>;}
