import { z } from "zod";
import { writeClient, requireAdmin, readJson, failure, ArticleError } from "@/lib/articles/client";
import { findSupplierDetails, allowSupplierLookup } from "@/lib/suppliers/lookup";
import { webUrl } from "@/lib/suppliers/schema";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const client = await writeClient(request);
    const user = await requireAdmin(client);
    const p = z.object({name: z.string().trim().min(1).max(120), website: webUrl.default("")}).strict().safeParse(await readJson(request));
    if (!p.success) throw new ArticleError("Enter a supplier name and, if known, its complete official website URL.");
    if (!allowSupplierLookup(user.id)) throw new ArticleError("Please wait a minute before requesting more supplier lookups.", 429);
    let result;
    try {result = await findSupplierDetails(p.data.name, p.data.website);}
    catch {throw new ArticleError("Lookup needs a public HTTPS supplier website. You can still fill in and save the form manually.");}
    return Response.json(result, {headers: {"Cache-Control": "private, no-store"}});
  } catch (e) {return failure(e);}
}
