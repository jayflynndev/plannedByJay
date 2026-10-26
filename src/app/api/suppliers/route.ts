import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeClient, readJson, failure, ArticleError } from "@/lib/articles/client";
import { saveSupplier, supplierDatabaseError, supplierProjection, supplierRecord } from "@/lib/suppliers/data";
export async function POST(request: Request) {
  try {
    const client = await writeClient(request);
    const supplier = await saveSupplier(client, await readJson(request));
    revalidatePath("/admin/suppliers");
    return Response.json({supplier}, {headers: {"Cache-Control": "private, no-store"}});
  } catch (e) {return failure(e);}
}
const archiveInput = z.object({id: z.uuid(), version: z.number().int().positive(), archived: z.boolean()}).strict();
export async function PATCH(request: Request) {
  try {
    const client = await writeClient(request);
    const p = archiveInput.safeParse(await readJson(request));
    if (!p.success) throw new ArticleError("Choose a saved supplier to archive or restore.");
    const r = await client.from("suppliers").update({archived: p.data.archived}).eq("id", p.data.id).eq("version", p.data.version).select(supplierProjection).maybeSingle();
    supplierDatabaseError(r.error);
    if (!r.data) throw new ArticleError("This supplier changed. Reload before archiving or restoring.", 409);
    revalidatePath("/admin/suppliers");
    return Response.json({supplier: supplierRecord(r.data)}, {headers: {"Cache-Control": "private, no-store"}});
  } catch (e) {return failure(e);}
}
