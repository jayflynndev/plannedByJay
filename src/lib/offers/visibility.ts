import 'server-only';
import type {SupabaseClient} from '@supabase/supabase-js';
import {loadOffers} from './data';
import {offersQuery} from './query';
import {publicationIssues,disclosureIssues,type OfferInput,type Supplier} from './schema';

export type OfferVisibility={visible:boolean|null;message:string};
/** Read-only diagnostics. A completed database save must never be reported as a failed save. */
export async function offerVisibility(client:SupabaseClient,offer:OfferInput,supplier?:Supplier,
  readPublic=async()=>{const {publicClient}=await import('@/lib/cms/client');const reader=publicClient();if(!reader)throw new Error('public client unavailable');return loadOffers(offersQuery.parse({}),{slug:offer.slug,limit:1},reader);},
):Promise<OfferVisibility>{
  if(offer.status!=='published')return {visible:false,message:'Not public: this offer is '+offer.status+'.'};
  try{
    const gate=await client.rpc('holiday_offers_enabled').abortSignal(AbortSignal.timeout(5000));
    if(gate.error||typeof gate.data!=='boolean')throw new Error('gate unavailable');
    if(!gate.data)return {visible:false,message:'Saved status is published, but the global public-offers gate is disabled. The catalogue and individual pages are hidden. Only the owner can authorise enabling it.'};
    const reasons=[...new Set([...publicationIssues(offer),...(supplier?disclosureIssues(offer,supplier):['Supplier is unavailable.'])])];
    if(reasons.length)return {visible:false,message:'Saved status is published, but not publicly available: '+reasons.join(' ')};
    const current=await client.rpc('holiday_offer_current',{p_id:offer.id}).abortSignal(AbortSignal.timeout(5000));
    if(current.error||typeof current.data!=='boolean')throw new Error('visibility unavailable');
    if(!current.data)return {visible:false,message:'Saved status is published, but the database public-visibility guard is withholding this offer. Check that migration 20261101 is applied. A legacy review hold requires deliberate republication after reviewing the saved offer; do not change the launch gate to bypass it.'};
    const result=await readPublic();
    if(!result.offers.some(o=>o.slug===offer.slug))return {visible:false,message:'Saved status is published, but the anonymous catalogue cannot read this offer. Check public RLS and supplier visibility before advertising its link.'};
    return {visible:true,message:'Public visibility confirmed: this offer is available in All Holiday Offers and on its individual page.'};
  }catch{return {visible:null,message:'Offer saved, but public visibility could not be verified. Check the public catalogue before advertising the offer; no launch setting was changed.'};}
}
