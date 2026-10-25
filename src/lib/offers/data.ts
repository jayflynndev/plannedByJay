import 'server-only';
import type {SupabaseClient} from '@supabase/supabase-js';
import {z} from 'zod';
import {cmsConfig} from '@/lib/cms/config';
import {databaseError} from '@/lib/cms/security';
import {imageUrl} from '@/lib/cms/urls';
import {supplierDisclosures,offerDetails,offerReference,isCurrentOffer,adminOffer,supplierInput} from './schema';
import type {Supplier,AdminOffer} from './schema';
import {offersQuery,type OffersQuery} from './query';
const publicSchema=z.object({reference:offerReference,title:z.string(),slug:z.string(),supplier_id:z.uuid(),status:z.literal('published'),holiday_types:z.array(z.string()),details:offerDetails,price_minor:z.number().int().positive(),currency:z.enum(['GBP','EUR','USD']),price_basis:z.enum(['per-person','total-party']),price_people:z.number().int().positive(),featured_media_id:z.uuid(),featured_alt:z.string(),gallery:z.array(z.object({media_id:z.uuid(),alt:z.string()})),featured:z.boolean(),expires_at:z.string().nullable(),updated_at:z.string(),holiday_offer_suppliers:z.object({display_name:z.string(),logo_id:z.uuid().nullable(),logo_alt:z.string(),disclosures:supplierDisclosures})});
const projection='reference,title,slug,supplier_id,status,holiday_types,details,price_minor,currency,price_basis,price_people,featured_media_id,featured_alt,gallery,featured,expires_at,updated_at,holiday_offer_suppliers!inner(display_name,logo_id,logo_alt,disclosures)';
export type PublicOffer=z.infer<typeof publicSchema>&{image:string|null;galleryImages:{src:string;alt:string}[];logo:string|null;previewAtolVerified?:boolean};
const literal=(value:string)=>value.replace(/[\\%_*]/g,'');
/** Fresh anonymous client even for signed-in visitors. No private schema/RPC. */
export async function loadOffers(query:OffersQuery=offersQuery.parse({}),options:{featured?:boolean;limit?:number;slug?:string;reference?:string}={},client:SupabaseClient|null=null):Promise<{offers:PublicOffer[];total:number}>{
  if(!client)return {offers:[],total:0};
  const signal=AbortSignal.timeout(5000),limit=Math.min(12,Math.max(1,Math.trunc(options.limit||12)));
  let request=client.from('holiday_offers').select(projection,{count:'exact'}).eq('status','published');
  if(options.featured)request=request.eq('featured',true);
  if(options.slug)request=request.eq('slug',options.slug);
  if(options.reference)request=request.eq('reference',options.reference);
  if(query.q)request=request.ilike('title',`%${literal(query.q)}%`);
  if(query.destination)request=request.ilike('details->>country',`%${literal(query.destination)}%`);
  // Derived classification: includes existing offers without rewriting saved categories.
  if(query.type==='all-inclusive')request=request.or('details->>board_basis.ilike.all inclusive,details->>board_basis.ilike.all-inclusive');
  else if(query.type)request=request.contains('holiday_types',[query.type]);
  if(query.supplier)request=request.eq('supplier_id',query.supplier);
  if(query.departure)request=request.ilike('details->>departure_point',`%${literal(query.departure)}%`);
  if(query.board)request=request.ilike('details->>board_basis',`%${literal(query.board)}%`);
  if(query.min!=='')request=request.gte('price_minor',query.min*100).eq('currency','GBP');
  if(query.max!=='')request=request.lte('price_minor',query.max*100).eq('currency','GBP');
  if(query.month){const [year,month]=query.month.split('-').map(Number);const end=new Date(Date.UTC(year,month,1)).toISOString().slice(0,10);request=request.gte('details->>departure_date',`${query.month}-01`).lt('details->>departure_date',end);}
  const result=await request.order('updated_at',{ascending:false}).order('reference').range((query.page-1)*limit,query.page*limit-1).abortSignal(signal);
  databaseError(result.error);const offers=z.array(publicSchema).parse(result.data).filter(offer=>isCurrentOffer(offer));
  const ids=[...new Set(offers.flatMap(o=>[o.featured_media_id,...o.gallery.map(i=>i.media_id),...(o.holiday_offer_suppliers.logo_id?[o.holiday_offer_suppliers.logo_id]:[])]))];
  const images=ids.length?await client.from('content_media').select('id,storage_path').in('id',ids).abortSignal(signal):{data:[],error:null};databaseError(images.error);
  const src=(id:string|null)=>{const m=images.data?.find(m=>m.id===id);return m?imageUrl(cmsConfig()?.url||'',m.storage_path):null;};
  return {total:result.count||0,offers:offers.map(o=>({...o,image:src(o.featured_media_id),logo:src(o.holiday_offer_suppliers.logo_id),galleryImages:o.gallery.flatMap(i=>{const s=src(i.media_id);return s?[{src:s,alt:i.alt}]:[];})}))};
}
export async function offerSuppliers(client:SupabaseClient):Promise<Supplier[]>{const result=await client.rpc('cms_offer_suppliers');databaseError(result.error);return (result.data||[]).map((s:Record<string,unknown>)=>({...supplierInput.parse(s),id:String(s.id)}));}
export async function getAdminOffer(client:SupabaseClient,id:string):Promise<AdminOffer|null>{const result=await client.rpc('cms_get_holiday_offer',{p_id:id});databaseError(result.error);return result.data?adminOffer(result.data):null;}
