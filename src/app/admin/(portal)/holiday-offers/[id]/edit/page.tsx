import {notFound} from 'next/navigation';
import {z} from 'zod';
import {pageAdmin} from '@/lib/cms/client';
import {offerSuppliers,getAdminOffer} from '@/lib/offers/data';
import {mediaList,tags} from '@/lib/cms/data';
import {cmsConfig} from '@/lib/cms/config';
import {offerVisibility} from '@/lib/offers/visibility';
import {OfferEditor} from '@/components/offers/OfferEditor';
export default async function EditOffer({params}:{params:Promise<{id:string}>}){const client=await pageAdmin();const {id}=await params;if(!z.uuid().safeParse(id).success)notFound();const [offer,suppliers,media,articleTags]=await Promise.all([getAdminOffer(client,id),offerSuppliers(client),mediaList(client),tags(client)]);if(!offer)notFound();const visibility=await offerVisibility(client,offer,suppliers.find(s=>s.id===offer.supplier_id));return <OfferEditor initial={offer} initialVisibility={visibility} suppliers={suppliers} initialMedia={media} tags={articleTags} mediaBase={cmsConfig()!.url}/>;}
