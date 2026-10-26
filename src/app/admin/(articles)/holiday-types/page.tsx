import { pageAdmin } from "@/lib/articles/client";
import { holidayDatabaseError } from "@/lib/holiday-types/data";
import { HolidayTypeActions } from "@/components/holidays/HolidayTypeActions";
export default async function HolidayTypeDashboard() {
  const c = await pageAdmin();
  const r = await c.from("holiday_types").select("id,name,slug,status,updated_at,version,is_original")
    .order("display_order").order("created_at").order("id");
  holidayDatabaseError(r.error);
  return <>
    <div className="article-admin-heading"><h1>Holiday Types</h1><a className="button" href="/admin/holiday-types/new">Add Holiday Type</a></div>
    <ul className="article-admin-list">{(r.data || []).map(h => <li key={h.id}><h2>{h.name || "Untitled draft"}</h2><p>{h.status === "published" ? "Published" : "Draft"} - Updated {new Date(h.updated_at).toLocaleDateString("en-GB", {timeZone: "Europe/London"})}</p><HolidayTypeActions holiday={h}/></li>)}</ul>
    {!r.data?.length && <p>No Holiday Types yet. Check that the manual Holiday Types migration has been run, or add a new type.</p>}
  </>;
}
