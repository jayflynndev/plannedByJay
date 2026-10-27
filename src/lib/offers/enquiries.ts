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
const deliveryVerified=true;
function storageConfig() {
  const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY;
  if(!url||!key)return null;
  try {return new URL(url).protocol==="https:"?{url,key}:null;}catch{return null;}
}
export function offerEnquiryAvailability() {
  return {enabled:deliveryVerified&&!!storageConfig()&&!!offerMailConfig()&&!!approvedPolicyHref("privacy"),message:"Offer enquiries are not available yet. No details are collected by this form."};
}
export function offerEnquiryServiceClient() {
  const config=storageConfig();
  if(!config)throw new ArticleError("Offer enquiries are unavailable.",503);
  return createClient(config.url,config.key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{fetch:(input,init)=>fetch(input,{...init,cache:"no-store",signal:init?.signal??AbortSignal.timeout(15000)})}});
}
export async function requireEnquiryAdmin(client:SupabaseClient) {
  // Retry uses a private client after this check. Reuse the database's existing
  // admin decision (including bans), rather than relying on email identity alone.
  const result=await client.rpc("articles_is_admin");
  if(result.error||result.data!==true)throw new ArticleError("This account cannot retry enquiry notifications.",403);
}
export type StoredOfferEnquiry=EnquiryNotification&{notification_id:string|null;notified_at:string|null;offer:{reference:string}|null};
export function storedOfferReference(enquiry:Pick<StoredOfferEnquiry,"offer_snapshot"|"offer">) {
  const reference=isOfferReference(enquiry.offer_snapshot.reference)?enquiry.offer_snapshot.reference:enquiry.offer?.reference;
  if(!isOfferReference(reference))throw new ArticleError("The saved offer reference is unavailable. Please retry later.",503);
  return reference;
}
export function notificationNeedsReview(createdAt:string,now=Date.now()) {
  const created=Date.parse(createdAt);
  // Resend retains idempotency keys for 24 hours. Leave a safety margin, and
  // require Jay to check older pending messages before deliberately retrying.
  return !Number.isFinite(created)||now-created>=23*60*60*1000;
}
export async function loadOfferEnquiry(client:SupabaseClient,id:string) {
  const r=await client.from("offer_enquiries").select("id,name,email,phone,message,created_at,offer_snapshot,notification_id,notified_at,offer:holiday_offers(reference)").eq("id",id).single();
  if(r.error||!r.data)throw new ArticleError("The saved enquiry could not be loaded. It remains available for administrator recovery.",503);
  return r.data as unknown as StoredOfferEnquiry;
}
export async function notifyOfferEnquiry(client:SupabaseClient,enquiry:StoredOfferEnquiry,confirmedUnsent=false) {
  if(enquiry.notification_id)return;
  if(notificationNeedsReview(enquiry.created_at)&&!confirmedUnsent)throw new ArticleError("Check Resend and the mailbox before retrying this older notification, to avoid sending a duplicate.",409);
  const notificationId=await sendOfferNotification({...enquiry,offer_reference:storedOfferReference(enquiry)});
  const marked=await client.from("offer_enquiries").update({notification_id:notificationId,notified_at:new Date().toISOString()}).eq("id",enquiry.id).is("notification_id",null);
  if(marked.error)throw new ArticleError("Resend accepted the email, but its receipt could not be saved. The enquiry is retained; retry uses the same notification key.",503);
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
  if(!offerMailConfig())throw new ArticleError("Offer enquiries are unavailable.",503);
  const client=offerEnquiryServiceClient(),key=storageConfig()!.key;
  // Vercel supplies this trusted address header. Unknown platforms share a rate
  // bucket rather than trusting arbitrary forwarded-for values from a browser.
  const candidate=process.env.VERCEL==="1"?request.headers.get("x-vercel-forwarded-for")?.split(",")[0].trim():"";
  const address=candidate&&isIP(candidate)?candidate:"shared-unknown-platform";
  const hashSecret=createHmac("sha256",key).update("plannedbyjay:offer-enquiry-rate-v1").digest("hex");
  const receipt=await storeOfferEnquiry(client,input,address,hashSecret);
  let enquiry:StoredOfferEnquiry;
  try {enquiry=await loadOfferEnquiry(client,receipt.enquiryId);}catch{
    throw new ArticleError("Your enquiry was saved, but confirmation could not be loaded. Retry this submission; it will not create a second enquiry.",503);
  }
  // Pre-migration snapshots remain intact. Their stable offer_id resolves the new
  // permanent number; new snapshots already contain that same six-digit number.
  const reference=storedOfferReference(enquiry);
  try {await notifyOfferEnquiry(client,enquiry);}catch(error){
    const code=(error as {cause?:{code?:unknown}})?.cause?.code;
    console.error("Offer enquiry notification pending",{enquiryId:enquiry.id,code:typeof code==="string"&&/^[A-Z0-9_]{1,80}$/.test(code)?code:"NOTIFICATION_UNCONFIRMED"});
    return {accepted:true as const,reference,notification:"pending" as const};
  }
  return {accepted:true as const,reference,notification:"accepted" as const};
}
