import { isOfferReference } from "@/lib/offers/schema";

export function OfferReference({reference}:{reference:string}) {
  return isOfferReference(reference)?<p className="offer-reference">Offer reference: {reference}</p>:null;
}
