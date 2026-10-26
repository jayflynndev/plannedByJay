import { notFound } from "next/navigation";
import { OfferDetail } from "@/components/offers/OfferViews";
import { publicOffer } from "@/lib/offers/data";
import { publicOrigin } from "@/lib/presentation";
import { approvedPolicyHref } from "@/content/policies";
import { offerEnquiryAvailability } from "@/lib/offers/enquiries";
export const dynamic="force-dynamic";
type Props={params:Promise<{slug:string}>};
export async function generateMetadata({params}:Props) {
  const o=await publicOffer((await params).slug);if(!o)notFound();
  const url=publicOrigin()+"/holiday-offers/"+o.slug;
  const images=o.image?[{url:o.image,alt:o.featured_alt}]:undefined;
  return {title:o.title+" | Planned by Jay",description:o.summary,alternates:{canonical:url},openGraph:{title:o.title,description:o.summary,url,type:"website" as const,...(images?{images}:{})},twitter:{card:images?"summary_large_image" as const:"summary" as const,title:o.title,description:o.summary,...(images?{images:images.map(i=>i.url)}:{})}};
}
export default async function HolidayOfferPage({params}:Props) {
  const o=await publicOffer((await params).slug);if(!o)notFound();
  const structured={"@context":"https://schema.org","@type":"WebPage",name:o.title,description:o.summary,url:publicOrigin()+"/holiday-offers/"+o.slug,...(o.image?{image:o.image}:{}),dateModified:o.updated_at};
  return <main id="main-content" tabIndex={-1} className="offer-page section"><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structured).replace(/</g,"\\u003c")}}/><OfferDetail offer={o} privacyHref={approvedPolicyHref("privacy")} enquiriesEnabled={offerEnquiryAvailability().enabled}/></main>;
}
