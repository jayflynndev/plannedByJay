import 'server-only';
import {createHmac} from 'node:crypto';
import {isIP} from 'node:net';
import type {SupabaseClient} from '@supabase/supabase-js';
import {ArticleError} from '@/lib/articles/client';
import {offerEnquiryAvailability,offerEnquiryServiceClient,notificationNeedsReview} from '@/lib/offers/enquiries';
import {sendEnquiryNotification} from '@/lib/offers/notifications';
import {bespokeInput,briefSnapshot,briefSnapshotSchema,isBespokeReference,isCustomerEnquiryReference,isLegacyBespokeReference} from './schema';

export function bespokeEnquiryAvailability(){
  return {enabled:process.env.BESPOKE_ENQUIRIES_ENABLED==='true'&&offerEnquiryAvailability().enabled};
}
export type StoredBespokeEnquiry={id:string;reference:string;issued_reference?:string|null;name:string;email:string;phone:string;created_at:string;brief:ReturnType<typeof briefSnapshot>;notification_id:string|null;notified_at:string|null;notification_attempted_at:string|null;last_notification_error:string|null};
export function customerEnquiryReference(enquiry:Pick<StoredBespokeEnquiry,'reference'|'issued_reference'>){
  // A stale PostgREST column cache must not hide a migrated customer's alias.
  if(isBespokeReference(enquiry.reference)&&enquiry.issued_reference===undefined)throw new ArticleError('The enquiry reference mapping is temporarily unavailable. Please retry shortly.',503);
  if(enquiry.issued_reference!=null){
    if(!isLegacyBespokeReference(enquiry.issued_reference)||(isLegacyBespokeReference(enquiry.reference)&&enquiry.reference!==enquiry.issued_reference))throw new ArticleError('The original enquiry reference is unavailable.',503);
    return enquiry.issued_reference;
  }
  if(!isCustomerEnquiryReference(enquiry.reference))throw new ArticleError('The enquiry reference is unavailable.',503);
  return enquiry.reference;
}
export const bespokeServiceClient=offerEnquiryServiceClient;
export async function loadBespokeEnquiry(client:SupabaseClient,id:string){
  const r=await client.from('bespoke_enquiries').select('*').eq('id',id).single();
  if(r.error||!r.data||!isCustomerEnquiryReference(r.data.reference))throw new ArticleError('The saved holiday brief could not be loaded. It remains available for administrator recovery.',503);
  customerEnquiryReference(r.data);
  return r.data as StoredBespokeEnquiry;
}
export async function notifyBespokeEnquiry(client:SupabaseClient,enquiry:StoredBespokeEnquiry,confirmedUnsent=false){
  if(enquiry.notification_id)return;
  if(notificationNeedsReview(enquiry.created_at)&&!confirmedUnsent)throw new ArticleError('Check Resend and the mailbox before retrying this older notification, to avoid sending a duplicate.',409);
  const snapshot=briefSnapshotSchema.safeParse(enquiry.brief);
  if(!snapshot.success||!Number.isFinite(Date.parse(enquiry.created_at)))throw new ArticleError('The stored brief is incomplete. It is retained for administrator review.',503);
  const reference=customerEnquiryReference(enquiry);
  const submitted=new Intl.DateTimeFormat('en-GB',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/London'}).format(new Date(enquiry.created_at));
  const text=['Planned by Jay: bespoke holiday brief',`Enquiry reference: ${reference}`,`Submitted: ${submitted} (Europe/London)`,`Internal enquiry ID: ${enquiry.id}`,'',...snapshot.data.summary.flatMap(row=>[row.label,row.value,''])].join('\n');
  try{
    const receipt=await sendEnquiryNotification({idempotencyKey:'bespoke-enquiry/'+enquiry.id,replyTo:enquiry.email,subject:'Bespoke holiday enquiry '+reference,text});
    const marked=await client.from('bespoke_enquiries').update({notification_id:receipt,notified_at:new Date().toISOString(),notification_attempted_at:new Date().toISOString(),last_notification_error:null}).eq('id',enquiry.id).is('notification_id',null);
    if(marked.error)throw new ArticleError('Resend accepted the email, but its receipt could not be saved. The brief is retained; retry uses the same notification key.',503);
  }catch(error){
    const code=(error as {cause?:{code?:unknown}})?.cause?.code;
    const safe=typeof code==='string'&&/^[A-Z0-9_]{1,80}$/.test(code)?code:'NOTIFICATION_UNCONFIRMED';
    await client.from('bespoke_enquiries').update({last_notification_error:safe,notification_attempted_at:new Date().toISOString()}).eq('id',enquiry.id).is('notification_id',null);
    throw error;
  }
}
export async function completeBespokeEnquiry(request:Request,input:unknown){
  const parsed=bespokeInput.safeParse(input);
  if(!parsed.success)throw new ArticleError('Check the highlighted answers in your holiday brief.');
  if(parsed.data.website)throw new ArticleError('The holiday brief could not be received.');
  const client=bespokeServiceClient();
  const candidate=process.env.VERCEL==='1'?request.headers.get('x-vercel-forwarded-for')?.split(',')[0].trim():'';
  const address=candidate&&isIP(candidate)?candidate:'shared-unknown-platform';
  const secret=createHmac('sha256',process.env.SUPABASE_SECRET_KEY!).update('plannedbyjay:bespoke-enquiry-rate-v1').digest('hex');
  const clientHash=createHmac('sha256',secret).update(address).digest('hex');
  const r=await client.rpc('receive_bespoke_enquiry',{p_request_id:parsed.data.request_id,p_brief:briefSnapshot(parsed.data.brief),p_client_hash:clientHash});
  if(r.error||!r.data)throw new ArticleError(r.error?.code==='54000'?'Please wait before sending another enquiry.':'Your holiday brief could not be received. Your answers are retained here; please try again.',r.error?.code==='54000'?429:503);
  let enquiry:StoredBespokeEnquiry;
  try{enquiry=await loadBespokeEnquiry(client,String(r.data));}catch{throw new ArticleError('Your holiday brief was saved, but confirmation could not be loaded. Retry this submission; it will not create a second enquiry.',503);}
  const reference=customerEnquiryReference(enquiry);
  try{await notifyBespokeEnquiry(client,enquiry);}catch{
    console.error('Bespoke enquiry notification pending',{enquiryId:enquiry.id});
    return {accepted:true as const,reference,notification:'pending' as const};
  }
  return {accepted:true as const,reference,notification:'accepted' as const};
}
