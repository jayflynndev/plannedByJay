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

/** Format only clearly separate inclusions; preserve prose and its qualifications. */
export function inclusionItems(text:string):string[]|null {
  const clean=text.trim();
  if(!clean)return null;
  const lines=clean.split(/\r?\n/).map(line=>line.trim()).filter(Boolean);
  const bulleted=lines.length>1&&lines.every(line=>/^(?:[-*•]|\d+[.)])\s+/.test(line));
  if(bulleted)return lines.map(line=>line.replace(/^(?:[-*•]|\d+[.)])\s+/,""));
  // Commas in numbers/parentheses/quotes or sentence-like clauses are ambiguous.
  if(/[()"“”]|\d,\d|[.!?]\s+\S/.test(clean)||/\b(?:including|except|subject|unless|depending|where|which|if|when|are|is|will|may|must|cannot|not|no|but|costs?|extra|payable|optional|charged|provided|served|requires?)\b/i.test(clean))return null;
  const parts=lines.length>1?lines:clean.split(",").map(item=>item.trim());
  return parts.length>1&&parts.length<=12&&parts.every(item=>item.length>0&&item.length<=160)?parts:null;
}
