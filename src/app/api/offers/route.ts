import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeClient, readJson, ArticleError, failure } from "@/lib/articles/client";
import { saveOffer, getOffer, duplicateInput, offerError } from "@/lib/offers/data";
function refresh() {for (const p of ["/","/holiday-offers","/admin/holiday-offers","/sitemap.xml"]) revalidatePath(p);revalidatePath("/holiday-offers/[slug]","page");revalidatePath("/holidays/[slug]","page");}
export async function POST(request:Request) {
  try {const client=await writeClient(request);const offer=await saveOffer(client,await readJson(request));refresh();return Response.json({offer},{headers:{"Cache-Control":"private, no-store"}});} catch(e){return failure(e);}
}
export async function PATCH(request:Request) {
  try {
    const client=await writeClient(request);
    const p=z.object({id:z.uuid(),version:z.number().int().positive(),action:z.enum(["unpublish","archive","restore","duplicate"])}).strict().safeParse(await readJson(request));
    if(!p.success)throw new ArticleError("Choose a saved offer and action.");
    if(p.data.action==="duplicate") {
      const original=await getOffer(client,p.data.id);
      if(!original || original.version!==p.data.version)throw new ArticleError("This offer changed. Reload before duplicating.",409);
      const offer=await saveOffer(client,duplicateInput(original));refresh();return Response.json({offer},{headers:{"Cache-Control":"private, no-store"}});
    }
    const fields=p.data.action==="unpublish" ? {status:"draft"} : p.data.action==="archive" ? {archived:true} : {archived:false,status:"draft"};
    const r=await client.from("holiday_offers").update(fields).eq("id",p.data.id).eq("version",p.data.version).select("id,version");offerError(r.error);
    if(!r.data?.length)throw new ArticleError("This offer changed. Reload before trying again.",409);
    refresh();return Response.json({ok:true},{headers:{"Cache-Control":"private, no-store"}});
  }catch(e){return failure(e);}
}
