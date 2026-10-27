import {z} from "zod";
import {revalidatePath} from "next/cache";
import {writeClient,readJson,ArticleError,failure} from "@/lib/articles/client";
import {loadOfferEnquiry,notifyOfferEnquiry,offerEnquiryServiceClient,requireEnquiryAdmin} from "@/lib/offers/enquiries";

export async function POST(request:Request) {
  try{
    const admin=await writeClient(request);
    await requireEnquiryAdmin(admin);
    const input=z.object({id:z.uuid(),confirmedUnsent:z.boolean().default(false)}).strict().safeParse(await readJson(request));
    if(!input.success)throw new ArticleError("Choose a saved enquiry.");
    const client=offerEnquiryServiceClient(),enquiry=await loadOfferEnquiry(client,input.data.id);
    await notifyOfferEnquiry(client,enquiry,input.data.confirmedUnsent);
    revalidatePath("/admin/offer-enquiries");
    return Response.json({notification:"accepted"},{headers:{"Cache-Control":"private, no-store"}});
  }catch(error){return failure(error);}
}
