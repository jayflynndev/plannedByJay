import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { EnquiryForm } from '@/components/enquiry/EnquiryForm';
import { enquiryContent } from '@/content/enquiry';
import { approvedPolicyHref } from '@/content/policies';
import { getEnquiryConfig } from '@/lib/enquiries/config';
import '../enquiry.css';
export const metadata: Metadata = enquiryContent.metadata;
// Read the submission gate at request time, rather than baking secret-dependent availability into a build.
export const dynamic = 'force-dynamic';
export default function PlanMyHoliday() {
  const config = getEnquiryConfig();
  return (
    <main id="main-content" tabIndex={-1} className="enquiry-page">
      <Container>
        <div className="enquiry-intro">
          <p className="eyebrow">{enquiryContent.eyebrow}</p>
          <h1>{enquiryContent.title}</h1>
          <p className="intro">{enquiryContent.description}</p>
        </div>
        <div className="enquiry-layout">
          <EnquiryForm
            enabled={!!config}
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
