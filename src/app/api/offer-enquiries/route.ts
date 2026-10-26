import { checkOrigin, ArticleError, failure,readJson } from "@/lib/articles/client";
import { offerEnquiryAvailability,completeOfferEnquiry } from "@/lib/offers/enquiries";
export async function POST(request:Request) {
  try {
    checkOrigin(request);
    // Do not read personal details or construct the private client while closed.
    const availability=offerEnquiryAvailability();
    if(!availability.enabled)throw new ArticleError(availability.message,503);
    const receipt=await completeOfferEnquiry(request,await readJson(request));
    return Response.json(receipt,{headers:{"Cache-Control":"private, no-store"}});
  }catch(e){return failure(e);}
}
