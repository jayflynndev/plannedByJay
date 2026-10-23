import {pageAdmin} from '@/lib/cms/client';
import {offerSuppliers,getAdminOffer} from '@/lib/offers/data';
import {mediaList,tags} from '@/lib/cms/data';
import {cmsConfig} from '@/lib/cms/config';
import {OfferEditor} from '@/components/offers/OfferEditor';
import {duplicateOffer} from '@/lib/offers/schema';
import {z} from 'zod';
export default async function NewOffer({searchParams}:{searchParams:Promise<{duplicate?:string}>}){const client=await pageAdmin();const query=await searchParams;const [suppliers,media,articleTags]=await Promise.all([offerSuppliers(client),mediaList(client),tags(client)]);const original=z.uuid().safeParse(query.duplicate).success?await getAdminOffer(client,query.duplicate!):null;const initial=original?{...duplicateOffer(original),reference:'Assigned on save'}:undefined;return <OfferEditor initial={initial} suppliers={suppliers} initialMedia={media} tags={articleTags} mediaBase={cmsConfig()!.url}/>;}
