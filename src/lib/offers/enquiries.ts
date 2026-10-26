import "server-only";
import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { ArticleError } from "@/lib/articles/client";
import { approvedPolicyHref } from "@/content/policies";
import { offerMailConfig,sendOfferNotification,type EnquiryNotification } from "./notifications";
import { isOfferReference } from "./schema";
// Retained Resend credentials are reused, but presence of old keys alone is not a
// successful delivery test. Keep collection closed until delivery is actually verified.
const deliveryVerified=false;
export function offerEnquiryAvailability() {
  return {enabled:deliveryVerified&&!!offerMailConfig()&&!!approvedPolicyHref("privacy"),message:"Offer enquiries are not available yet. No details are collected by this form."};
}
export const enquiryInput = z.object({request_id:z.uuid(),offer_id:z.uuid(),name:z.string().trim().min(1).max(120),email:z.email().max(320),phone:z.string().trim().max(50).default(""),message:z.string().trim().max(3000).default(""),website:z.string().max(200).default("")}).strict();
// Prepared storage boundary for an approved mail adapter, not exposed to anonymous clients.
// The SQL transaction snapshots the current offer and rate-limits this keyed client hash.
export async function storeOfferEnquiry(client: SupabaseClient, input: unknown, clientAddress: string, hashSecret: string) {
  const p = enquiryInput.safeParse(input);
  if (!p.success || p.data.website) throw new ArticleError("Check your enquiry details.");
  if (!hashSecret || !clientAddress) throw new ArticleError("Enquiries are unavailable.",503);
  const v = p.data;
  const r = await client.rpc("receive_offer_enquiry",{p_request_id:v.request_id,p_offer_id:v.offer_id,p_name:v.name,p_email:v.email,p_phone:v.phone,p_message:v.message,p_client_hash:createHmac("sha256",hashSecret).update(clientAddress).digest("hex")});
  if (r.error) throw new ArticleError(r.error.code === "54000" ? "Please wait before sending another enquiry." : "The enquiry could not be received. Please try again later.", r.error.code === "54000" ? 429 : 503);
  return {enquiryId:String(r.data)};
}
export async function completeOfferEnquiry(request:Request,input:unknown) {
  const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY;
  if(!url||!key||!offerMailConfig())throw new ArticleError("Offer enquiries are unavailable.",503);
  const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{fetch:(input,init)=>fetch(input,{...init,cache:"no-store"})}});
  // Vercel supplies this trusted address header. Unknown platforms share a rate
  // bucket rather than trusting arbitrary forwarded-for values from a browser.
  const candidate=process.env.VERCEL==="1"?request.headers.get("x-vercel-forwarded-for")?.split(",")[0].trim():"";
  const address=candidate&&isIP(candidate)?candidate:"shared-unknown-platform";
  const hashSecret=createHmac("sha256",key).update("plannedbyjay:offer-enquiry-rate-v1").digest("hex");
  const receipt=await storeOfferEnquiry(client,input,address,hashSecret);
  const r=await client.from("offer_enquiries").select("id,name,email,phone,message,offer_snapshot,notification_id,offer:holiday_offers(reference)").eq("id",receipt.enquiryId).single();
  if(r.error||!r.data)throw new ArticleError("The enquiry could not be completed. Please retry shortly.",503);
  const snapshot=r.data.offer_snapshot as Record<string,unknown>;
  const linked=r.data.offer as unknown as {reference:string}|null;
  // Pre-migration snapshots remain intact. Their stable offer_id resolves the new
  // permanent number; new snapshots already contain that same six-digit number.
  const reference=isOfferReference(snapshot.reference)?snapshot.reference:linked?.reference;
  if(!isOfferReference(reference))throw new ArticleError("The saved offer reference is unavailable. Please retry later.",503);
  if(!r.data.notification_id){
    const notificationId=await sendOfferNotification({...r.data,offer_reference:reference} as EnquiryNotification);
    const marked=await client.from("offer_enquiries").update({notification_id:notificationId,notified_at:new Date().toISOString()}).eq("id",receipt.enquiryId).is("notification_id",null);
    if(marked.error)throw new ArticleError("The enquiry notification receipt could not be saved. Please retry shortly.",503);
  }
  return {reference};
}
