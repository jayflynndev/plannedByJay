import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ArticleError, publicArticlesClient } from "@/lib/articles/client";
import { imageUrl } from "@/lib/articles/data";
import { cleanHtml } from "@/lib/articles/html";
import { getSupplier } from "@/lib/suppliers/data";
import { supplierInput } from "@/lib/suppliers/schema";
import { emptyOffer, offerInput, emptyOfferQuery, type Offer, type OfferInput, type OfferQuery, type PublicOffer, type PublicSupplier } from "./schema";
import { prepareOffer, supplierPublicationIssue } from "./validation";
import {imageDescription} from '@/content/image-descriptions';
export function offerError(error: {code?: string} | null) {
  if (!error) return;
  const messages: Record<string,[string,number]> = {
    "23505": ["That offer URL is already used. Choose another before publishing.",409],
    "40001": ["This offer changed in another tab. Copy your edits before reloading.",409],
    "42501": ["This account is not authorised to manage offers.",403],
    "22023": ["Check the offer, published Holiday Types and selected Approved supplier. Published URLs cannot change.",400],
  };
  const [message,status] = messages[error.code || ""] || ["Holiday Offers are unavailable. Check the Offers SQL setup or try again. Your edits are retained.",503];
  throw new ArticleError(message,status);
}
export function offerRecord(raw: Record<string, unknown>): Offer {
  const fields = Object.fromEntries(Object.keys(emptyOffer()).map(k => [k,raw[k]]));
  for (const key of ["departure_date","return_date","price_checked_on","booking_deadline"]) fields[key] ||= "";
  return {...offerInput.parse(fields), featured_alt:imageDescription(String(raw.featured_image||''),String(raw.featured_alt||'')),body: cleanHtml(String(raw.body || "")), id: String(raw.id), reference: String(raw.reference || ""), previous_reference:typeof raw.previous_reference==='string'?raw.previous_reference:null,archived: raw.archived === true, created_at: String(raw.created_at || ""), updated_at: String(raw.updated_at || ""), published_at: raw.published_at ? String(raw.published_at) : null};
}
const publicSupplierFields = {id:true,name:true,website:true,legal_name:true,business_address:true,contact_email:true,contact_url:true,booking_conditions_url:true,atol_holder:true,atol_number:true} as const;
export function displayOffer(o: Offer, supplier: Record<string, unknown>): PublicOffer {
  const safeSupplier = supplierInput.pick(publicSupplierFields).parse(Object.fromEntries(Object.keys(publicSupplierFields).map(k => [k,supplier[k]]))) as PublicSupplier;
  if (o.protection !== "supplier-atol") {safeSupplier.atol_holder = ""; safeSupplier.atol_number = "";}
  return {...o, supplier: safeSupplier, image: imageUrl(o.featured_image), galleryImages: o.gallery.map(i => ({src: imageUrl(i.path)!,alt:i.alt}))};
}
export async function getOffer(client: SupabaseClient, id: string) {
  const r = await client.from("holiday_offers").select("*").eq("id",id).maybeSingle(); offerError(r.error);
  if (!r.data) return null;
  const links = await client.from("offer_holiday_types").select("holiday_type_id").eq("offer_id",id); offerError(links.error);
  return offerRecord({...r.data,holiday_type_ids:(links.data || []).map(l=>l.holiday_type_id)});
}
export async function saveOffer(client: SupabaseClient, input: unknown) {
  const value = prepareOffer(input);
  if (value.status === "published" && value.supplier_id) {
    const s = await getSupplier(client,value.supplier_id);
    if (!s) throw new ArticleError("Choose an existing Approved supplier.");
    const issue = supplierPublicationIssue(s,value.protection === "supplier-atol");
    if (issue) throw new ArticleError(issue);
  }
  const {holiday_type_ids,...fields} = value;
  const p_offer: Record<string,unknown> = {...fields};
  for (const key of ["departure_date","return_date","price_checked_on","booking_deadline"]) p_offer[key] ||= null;
  const r = await client.rpc("save_holiday_offer",{p_offer,p_types:holiday_type_ids}); offerError(r.error);
  return offerRecord(r.data);
}
export async function previewOffer(client: SupabaseClient, input: unknown) {
  const value = prepareOffer(input);
  const supplier = value.supplier_id ? await getSupplier(client,value.supplier_id) : null;
  let reference="";
  if(value.id){
    const result=await client.from("holiday_offers").select("reference").eq("id",value.id).maybeSingle();offerError(result.error);
    if(!result.data)throw new ArticleError("This saved offer is no longer available.",404);
    reference=result.data.reference;
  }
  return displayOffer(offerRecord({...value,reference}),supplier || {id:null,name:"Supplier not selected"});
}
export async function publicOffers(query: OfferQuery = emptyOfferQuery, options: {featured?: boolean; slug?: string; limit?: number} = {}) {
  const c = publicArticlesClient();
  if (!c) return {offers: [] as PublicOffer[], total: 0};
  const r = await c.rpc("public_holiday_offers",{p_destination:query.destination,p_type:query.type || null,p_month:query.month ? query.month+"-01" : null,p_sort:query.sort,p_featured:!!options.featured,p_slug:options.slug || null,p_offset:(query.page-1)*(options.limit || 12),p_limit:options.limit || 12});
  offerError(r.error);
  return {offers: ((r.data?.offers || []) as Record<string,unknown>[]).map(raw=>displayOffer(offerRecord(raw),raw.supplier as Record<string,unknown>)), total:Number(r.data?.total || 0)};
}
export async function publicOffer(slug: string) {return (await publicOffers(emptyOfferQuery,{slug,limit:1})).offers[0] || null;}
export function duplicateInput(o: Offer): OfferInput {
  const fields = Object.fromEntries(Object.keys(emptyOffer()).map(k=>[k,o[k as keyof OfferInput]]));
  return offerInput.parse({...fields,id:null,version:0,title:(o.title+" copy").slice(0,180),slug:o.slug.slice(0,45)+"-"+crypto.randomUUID().slice(0,8),status:"draft",featured:false,price_checked_on:""});
}
