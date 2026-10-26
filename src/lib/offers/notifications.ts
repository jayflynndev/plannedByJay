import "server-only";
import { z } from "zod";
import { ArticleError } from "@/lib/articles/client";
export function offerMailConfig() {
  const key=process.env.RESEND_API_KEY,from=process.env.ENQUIRY_EMAIL_FROM,to=process.env.ENQUIRY_EMAIL_TO;
  if(!key||!from||/[\r\n]/.test(from)||!/@/.test(from)||to?.trim().toLowerCase()!=="jay@plannedbyjay.com")return null;
  return {key,from,to:"jay@plannedbyjay.com"};
}
export type EnquiryNotification={id:string;name:string;email:string;phone:string;message:string;offer_snapshot:Record<string,unknown>};
export async function sendOfferNotification(enquiry:EnquiryNotification,send:typeof fetch=fetch) {
  const config=offerMailConfig();
  if(!config)throw new ArticleError("Offer enquiry notification delivery is unavailable.",503);
  const s=enquiry.offer_snapshot;
  const text=["Planned by Jay: offer enquiry",`Enquiry reference: ${enquiry.id}`,`Offer: ${String(s.reference)} - ${String(s.title)}`,`Supplier: ${String((s.supplier as {name?:string})?.name||"")}`,`Travel: ${String(s.departure_date||"")} to ${String(s.return_date||"")} (${String(s.nights??"")} nights)`,`Advertised party total: ${String(s.currency)} ${Number(s.total_price_minor||0)/100}`,`Party: ${String(s.adults)} adults, ${String(s.children)} children; child ages: ${JSON.stringify(s.child_ages||[])}`,`Price checked: ${String(s.price_checked_on||"")}`,`Charges: ${String(s.mandatory_charges||"")}`,"",`Name: ${enquiry.name}`,`Email: ${enquiry.email}`,`Phone: ${enquiry.phone||"Not supplied"}`,"Question:",enquiry.message||"No question supplied."].join("\n");
  let response:Response;
  try {response=await send("https://api.resend.com/emails",{method:"POST",cache:"no-store",signal:AbortSignal.timeout(10000),headers:{Authorization:`Bearer ${config.key}`,"Content-Type":"application/json","Idempotency-Key":"offer-enquiry/"+enquiry.id},body:JSON.stringify({from:config.from,to:[config.to],reply_to:enquiry.email,subject:"Holiday enquiry "+String(s.reference||enquiry.id),text})});}
  catch(error) {
    const failure=new ArticleError("The enquiry notification could not be delivered. Keep your details and try again shortly.",503);
    const code=(error as {cause?:{code?:unknown}})?.cause?.code;
    failure.cause={code:typeof code==="string"&&/^[A-Z0-9_]{1,80}$/.test(code)?code:"NETWORK_ERROR"};throw failure;
  }
  if(!response.ok){const failure=new ArticleError("The enquiry notification was not accepted by the email service. Keep your details and try again shortly.",503);failure.cause={code:"HTTP_"+response.status};throw failure;}
  const result=z.object({id:z.string().min(1).max(200)}).safeParse(await response.json());
  if(!result.success)throw new ArticleError("The email service did not confirm receipt. Please retry shortly.",503);
  return result.data.id;
}
