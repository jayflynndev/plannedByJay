import {supplierDisclosures} from '@/lib/offers/schema';
import {notFound} from 'next/navigation';
import {z} from 'zod';
import {pageAdmin} from '@/lib/cms/client';
import {getAdminOffer,offerSuppliers,type PublicOffer} from '@/lib/offers/data';
import {publicMedia} from '@/lib/cms/data';
import {imageUrl} from '@/lib/cms/urls';
import {cmsConfig} from '@/lib/cms/config';
import {OfferDetail} from '@/components/offers/OfferViews';
export default async function PreviewOffer({params}:{params:Promise<{id:string}>}){const client=await pageAdmin();const {id}=await params;if(!z.uuid().safeParse(id).success)notFound();const offer=await getAdminOffer(client,id);if(!offer)notFound();const suppliers=await offerSuppliers(client),supplier=suppliers.find(s=>s.id===offer.supplier_id);const media=await publicMedia(client,offer.featured_media_id);const galleryImages=await Promise.all(offer.gallery.map(async i=>{const photo=await publicMedia(client,i.media_id);return photo?{src:imageUrl(cmsConfig()!.url,photo.storage_path),alt:i.alt}:null;}));const preview={...offer,previewAtolVerified:!!supplier?.atol_verified,slug:offer.slug||'',price_minor:offer.price_minor||0,price_people:offer.price_people||0,status:'published',supplier_id:offer.supplier_id||'',holiday_offer_suppliers:{display_name:supplier?.display_name||'Supplier not selected',logo_id:null,logo_alt:'',disclosures:supplier?.disclosures||supplierDisclosures.parse({})},image:media?imageUrl(cmsConfig()!.url,media.storage_path):null,logo:null,galleryImages:galleryImages.filter((i):i is {src:string;alt:string}=>!!i)} as PublicOffer;return <><p className="cms-notice">Private saved preview. This is not a live offer. <a href={`/admin/holiday-offers/${id}/edit`}>Return to editing</a></p><OfferDetail offer={preview} preview/></>;}
