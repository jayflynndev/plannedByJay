import {notFound} from 'next/navigation';
import {safeOffers,offersEnabled} from '@/lib/offers/public';
import {offersQuery} from '@/lib/offers/query';
import {OfferDetail} from '@/components/offers/OfferViews';
import {Container} from '@/components/ui/Container';
import {publicOrigin} from '@/lib/cms/config';
export const dynamic='force-dynamic';
type Props={params:Promise<{slug:string}>};
async function find(slug:string){if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||slug.length>140||!await offersEnabled())notFound();const result=await safeOffers(offersQuery.parse({}),{slug,limit:1});if(!result.offers[0])notFound();return result.offers[0];}
export async function generateMetadata({params}:Props){const o=await find((await params).slug);return {title:`${o.title} | Planned by Jay`,description:o.details.summary,alternates:{canonical:`${publicOrigin()}/holiday-offers/${o.slug}`},openGraph:{title:o.title,description:o.details.summary,url:`${publicOrigin()}/holiday-offers/${o.slug}`,type:'website'}};}
export default async function OfferPage({params}:Props){const offer=await find((await params).slug);return <main id="main-content" tabIndex={-1} className="offer-page section"><Container><OfferDetail offer={offer}/></Container></main>;}
