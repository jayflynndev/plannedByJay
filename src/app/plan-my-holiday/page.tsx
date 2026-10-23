import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { EnquiryForm } from '@/components/enquiry/EnquiryForm';
import { enquiryContent } from '@/content/enquiry';
import { approvedPolicyHref } from '@/content/policies';
import { getEnquiryConfig } from '@/lib/enquiries/config';
import '../enquiry.css';
import {safeOffers} from '@/lib/offers/public';
import {offersQuery} from '@/lib/offers/query';
import {offerReference,priceLabel} from '@/lib/offers/schema';
export const metadata: Metadata = enquiryContent.metadata;
// Read the submission gate at request time, rather than baking secret-dependent availability into a build.
export const dynamic = 'force-dynamic';
export default async function PlanMyHoliday({searchParams}:{searchParams?:Promise<{offer?:string|string[]}>}={}) {
  const config = getEnquiryConfig();
  const requested=(await searchParams)?.offer;const valid=offerReference.safeParse(requested);
  const offer=valid.success?(await safeOffers(offersQuery.parse({}),{reference:valid.data,limit:1})).offers[0]:undefined;
  return (
    <main id="main-content" tabIndex={-1} className="enquiry-page">
      <Container>
        <div className="enquiry-intro">
          <p className="eyebrow">{enquiryContent.eyebrow}</p>
          <h1>{enquiryContent.title}</h1>
          <p className="intro">{enquiryContent.description}</p>
        </div>
        {requested&&!offer&&<p role="status">That offer is not currently available to reference. You can still send a general Holiday Brief for me to research options.</p>}
        <div className="enquiry-layout">
          <EnquiryForm
            enabled={!!config}
            offerContext={offer?{reference:offer.reference,title:offer.title,price:priceLabel(offer),updatedAt:offer.updated_at}:null}
            privacyHref={approvedPolicyHref('privacy')}
            turnstileSiteKey={config?.turnstileSiteKey}
          />
          <aside className="enquiry-aside">
            <span className="aside-symbol" aria-hidden="true">
              ✳
            </span>
            <h2>{enquiryContent.asideTitle}</h2>
            <ul>
              {enquiryContent.asidePoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            <p>{enquiryContent.asideNote}</p>
          </aside>
        </div>
      </Container>
    </main>
  );
}
