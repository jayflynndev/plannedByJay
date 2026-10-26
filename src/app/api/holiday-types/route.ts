import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeClient, readJson, failure, ArticleError } from "@/lib/articles/client";
import { holidayDatabaseError } from "@/lib/holiday-types/data";
import { saveHoliday } from "@/lib/holiday-types/save";

function refreshHolidays() {
  for (const path of ["/", "/holidays", "/sitemap.xml", "/admin/holiday-types"]) revalidatePath(path);
  revalidatePath("/holidays/[slug]", "page");
}
export async function POST(request: Request) {
  try {
    const c = await writeClient(request);
    const article = await saveHoliday(c, await readJson(request));
    refreshHolidays();
    return Response.json({holiday: article}, {headers: {"Cache-Control": "private, no-store"}});
  } catch (e) { return failure(e); }
}
const identity = z.object({id: z.uuid(), version: z.number().int().positive()}).strict();
export async function PATCH(request: Request) {
  try {
    const c = await writeClient(request);
    const p = identity.safeParse(await readJson(request));
    if (!p.success) throw new ArticleError("Choose a saved Holiday Type to unpublish.");
    const r = await c.from("holiday_types").update({status: "draft"}).eq("id", p.data.id).eq("version", p.data.version).select("id");
    holidayDatabaseError(r.error);
    if (!r.data?.length) throw new ArticleError("This Holiday Type changed. Reload before unpublishing.", 409);
    refreshHolidays();
    return Response.json({ok: true}, {headers: {"Cache-Control": "private, no-store"}});
  } catch (e) { return failure(e); }
}
export async function DELETE(request: Request) {
  try {
    const c = await writeClient(request);
    const p = identity.safeParse(await readJson(request));
    if (!p.success) throw new ArticleError("Choose a saved Holiday Type to delete.");
    const r = await c.from("holiday_types").delete().eq("id", p.data.id).eq("version", p.data.version).select("id");
    holidayDatabaseError(r.error);
    if (!r.data?.length) throw new ArticleError("This Holiday Type changed or was deleted. Reload the list.", 409);
    refreshHolidays();
    return Response.json({ok: true}, {headers: {"Cache-Control": "private, no-store"}});
  } catch (e) { return failure(e); }
}
