import { pageAdmin } from "@/lib/articles/client";
import { publicOrigin } from "@/lib/presentation";
import { HolidayTypeEditor } from "@/components/holidays/HolidayTypeEditor";
export default async function NewHolidayType() {
  await pageAdmin();
  return <HolidayTypeEditor publicBaseUrl={publicOrigin()}/>;
}
