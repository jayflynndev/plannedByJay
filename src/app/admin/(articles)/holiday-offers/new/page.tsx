import { pageAdmin } from "@/lib/articles/client";
import { publicOrigin } from "@/lib/presentation";
import { offerEditorChoices } from "@/lib/offers/editor-data";
import { OfferEditor } from "@/components/offers/OfferEditor";
export default async function NewOffer(){const c=await pageAdmin();return <OfferEditor {...await offerEditorChoices(c)} publicBaseUrl={publicOrigin()}/>;}
