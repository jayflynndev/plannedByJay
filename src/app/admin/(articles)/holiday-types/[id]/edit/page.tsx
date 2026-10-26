import { notFound } from "next/navigation";
import { z } from "zod";
import { pageAdmin } from "@/lib/articles/client";
import { getHoliday, holidayPhoto } from "@/lib/holiday-types/data";
import { publicOrigin } from "@/lib/presentation";
import { HolidayTypeEditor } from "@/components/holidays/HolidayTypeEditor";
export default async function EditHolidayType({params}: {params: Promise<{id: string}>}) {
  const c = await pageAdmin();
  const {id} = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const holiday = await getHoliday(c, id);
  if (!holiday) notFound();
  return <HolidayTypeEditor initial={holiday} initialImageUrl={holidayPhoto(holiday.image) || ""} publicBaseUrl={publicOrigin()}/>;
}
