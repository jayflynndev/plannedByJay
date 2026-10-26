import { HolidayLanding } from "@/components/holidays/HolidayPages";
import { holidayMetadata } from "@/lib/holiday-metadata";
import { publicOrigin } from "@/lib/presentation";
import { publicHolidayTypes, holidayPhoto } from "@/lib/holiday-types/data";
export const dynamic = "force-dynamic";
export function generateMetadata() { return holidayMetadata(publicOrigin()); }
export default async function Holidays() {
  let holidays: Awaited<ReturnType<typeof publicHolidayTypes>> = [], unavailable = false;
  try {
    holidays = await publicHolidayTypes();
  } catch { unavailable = true; }
  return <HolidayLanding holidays={holidays.map(h => ({...h, photoUrl: holidayPhoto(h.image)}))} unavailable={unavailable}/>;
}
