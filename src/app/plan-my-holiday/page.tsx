import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { EnquiryForm } from '@/components/enquiry/EnquiryForm';
import { enquiryContent } from '@/content/enquiry';
import { approvedPolicyHref } from '@/content/policies';
import '../enquiry.css';
export const metadata: Metadata=enquiryContent.metadata;
export default function PlanMyHoliday(){return <main id="main-content" tabIndex={-1} className="enquiry-page"><Container><div className="enquiry-intro"><p className="eyebrow">{enquiryContent.eyebrow}</p><h1>{enquiryContent.title}</h1><p className="intro">{enquiryContent.description}</p></div><div className="enquiry-layout"><EnquiryForm privacyHref={approvedPolicyHref('privacy')}/><aside className="enquiry-aside"><span className="aside-symbol" aria-hidden="true">&#10035;</span><h2>{enquiryContent.asideTitle}</h2><ul>{enquiryContent.asidePoints.map(point=><li key={point}>{point}</li>)}</ul><p>{enquiryContent.asideNote}</p></aside></div></Container></main>;}
