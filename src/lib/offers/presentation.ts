import type { OfferInput } from "./schema";

export function cardReason(text:string) {
  const clean=text.trim().replace(/\s+/g," ");
  if(clean.length<=110)return clean;
  const start=clean.slice(0,111);
  return start.slice(0,start.lastIndexOf(" ")>0?start.lastIndexOf(" "):110).trimEnd()+"…";
}

export function cardBenefit(offer:OfferInput) {
  // Only a standalone, explicitly saved inclusion. Never infer a promotion from
  // the supplier, price, sash or party; suppress it if the text contains a caveat.
  if(!offer.children||/\b(?:not|no|excluding|excluded|subject|selected|limited|may|availability|conditions)\b/i.test(offer.inclusions))return "";
  return offer.inclusions.split(/[,;\n]/).map(s=>s.trim().replace(/[.!]$/,""))
    .find(s=>/^free child place$/i.test(s))||"";
}
