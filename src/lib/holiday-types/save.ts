import type { SupabaseClient } from "@supabase/supabase-js";
import { ArticleError } from "@/lib/articles/client";
import { cleanHtml, bodyText } from "@/lib/articles/html";
import { holidayInput, holidaySlug } from "./schema";
import { holidayDatabaseError, holidayProjection, holidayRecord } from "./data";

export function prepareHoliday(input: unknown) {
  const p = holidayInput.safeParse(input);
  if (!p.success) throw new ArticleError("Check the Holiday Type fields: " + p.error.issues.map(i => i.message).join(" "));
  const value = p.data;
  value.body = cleanHtml(value.body);
  value.heading = value.heading || value.name;
  value.slug = value.slug || holidaySlug(value.name);
  if (value.status === "published" && (!value.name || !bodyText(value.body)))
    throw new ArticleError("Add a name and page content before publishing.");
  return value;
}
export async function saveHoliday(client: SupabaseClient, input: unknown) {
  const {id, version, ...fields} = prepareHoliday(input);
  const query = id
    ? client.from("holiday_types").update(fields).eq("id", id).eq("version", version)
    : client.from("holiday_types").insert(fields);
  const r = await query.select(holidayProjection).maybeSingle();
  holidayDatabaseError(r.error);
  if (!r.data) throw new ArticleError("This Holiday Type changed or was deleted. Copy your edits before reloading.", 409);
  return holidayRecord(r.data);
}
