import {notFound} from 'next/navigation';
import {offersEnabled,safeOffers} from '@/lib/offers/public';
import {offersQuery} from '@/lib/offers/query';
import {OffersListing} from '@/components/offers/OfferViews';
import {offersCopy} from '@/content/offers';
import {publicClient} from '@/lib/cms/client';
import {publicOrigin} from '@/lib/cms/config';
export const dynamic='force-dynamic';
export async function generateMetadata(){if(!await offersEnabled())notFound();return {title:'Holiday Offers | Planned by Jay',description:offersCopy.description,alternates:{canonical:`${publicOrigin()}/holiday-offers`},openGraph:{title:'Holiday Offers | Planned by Jay',description:offersCopy.description,url:`${publicOrigin()}/holiday-offers`,type:'website'}};}
export default async function OfferListing({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){if(!await offersEnabled())notFound();const parsed=offersQuery.safeParse(await searchParams);const query=parsed.success?parsed.data:offersQuery.parse({});const result=await safeOffers(query);const suppliers=await publicClient()!.from('holiday_offer_suppliers').select('id,display_name').order('display_name').limit(1000).abortSignal(AbortSignal.timeout(5000));return <OffersListing query={query} {...result} suppliers={suppliers.data||[]} error={!parsed.success?'Check your filters and try again.':result.unavailable?offersCopy.unavailable:undefined}/>;}
