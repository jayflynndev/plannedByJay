import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { publicArticlesClient, ArticleError } from "@/lib/articles/client";
import { imageUrl } from "@/lib/articles/data";
import { cleanHtml } from "@/lib/articles/html";
import { holidayInput, type HolidayType } from "./schema";

export const holidayProjection = "id,name,slug,introduction,heading,body,image,image_alt,image_position,closing_heading,closing_body,status,is_original,display_order,created_at,updated_at,published_at,version";
export function holidayRecord(raw: Record<string, unknown>): HolidayType {
  return {
    ...holidayInput.parse(Object.fromEntries(Object.keys(holidayInput.parse({})).map(k => [k, raw[k]]))),
    id: String(raw.id), body: cleanHtml(String(raw.body || "")),
    is_original: raw.is_original === true, display_order: Number(raw.display_order),
    created_at: String(raw.created_at), updated_at: String(raw.updated_at),
    published_at: raw.published_at ? String(raw.published_at) : null,
  };
}
export function holidayPhoto(image: string) {
  return image.startsWith("/images/destinations/") ? image : imageUrl(image);
}
export function holidayDatabaseError(error: {code?: string; message?: string} | null) {
  if (!error) return;
  const messages: Record<string, [string, number]> = {
    "23505": ["That URL is already used. Choose another Holiday Type URL.", 409],
    "40001": ["This Holiday Type changed in another tab. Copy your edits before reloading.", 409],
    "42501": ["This account is not authorised for this action.", 403],
    "22023": ["Published URLs and the original six Holiday Types are protected. Reload before trying again.", 409],
  };
  const [message, status] = messages[error.code || ""] || ["Holiday Types are unavailable. Check the Holiday Types SQL setup or try again. Your unsaved work is retained.", 503];
  throw new ArticleError(message, status);
}
export async function getHoliday(client: SupabaseClient, id: string) {
  const r = await client.from("holiday_types").select(holidayProjection).eq("id", id).maybeSingle();
  holidayDatabaseError(r.error);
  return r.data ? holidayRecord(r.data) : null;
}
export async function publicHoliday(slug: string) {
  const c = publicArticlesClient();
  if (!c) return null;
  const r = await c.from("holiday_types").select(holidayProjection).eq("slug", slug).eq("status", "published").maybeSingle();
  holidayDatabaseError(r.error);
  return r.data ? holidayRecord(r.data) : null;
}
export async function publicHolidayTypes() {
  const c = publicArticlesClient();
  if (!c) return [];
  const rows: HolidayType[] = [];
  for (let offset = 0; ; offset += 1000) {
    const r = await c.from("holiday_types").select(holidayProjection).eq("status", "published")
      .order("display_order").order("created_at").order("id").range(offset, offset + 999)
      .abortSignal(AbortSignal.timeout(8000));
    holidayDatabaseError(r.error);
    rows.push(...(r.data || []).map(holidayRecord));
    if ((r.data?.length || 0) < 1000) return rows;
  }
}
