import { notFound } from "next/navigation";
import { z } from "zod";
import { pageAdmin } from "@/lib/articles/client";
import { publicOrigin } from "@/lib/presentation";
import { imageUrl } from "@/lib/articles/data";
import { getOffer } from "@/lib/offers/data";
import { offerEditorChoices } from "@/lib/offers/editor-data";
import { OfferEditor } from "@/components/offers/OfferEditor";
export default async function EditOffer({params}:{params:Promise<{id:string}>}) {
  const c=await pageAdmin(),{id}=await params;if(!z.uuid().safeParse(id).success)notFound();
  const offer=await getOffer(c,id);if(!offer)notFound();
  return <OfferEditor initial={offer} {...await offerEditorChoices(c,offer.supplier_id)} initialImageUrl={imageUrl(offer.featured_image)||""} galleryUrls={Object.fromEntries(offer.gallery.map(i=>[i.path,imageUrl(i.path)||""]))} publicBaseUrl={publicOrigin()}/>;
}
