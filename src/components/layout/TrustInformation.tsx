import { site } from '@/content/site';
import { SiteImage } from '@/components/ui/SiteImage';
export function TrustInformation() {
  const business=site.business;const logos=site.logos.filter(logo=>logo.src&&logo.approvedForDisplay);
  return <div className="trust-information"><p>{business.tradingStatement}</p><p>{business.partnership}</p>
    <p><strong>{business.legalEntityName||business.companyDisplayName}</strong> · {business.registration} · Company number {business.companyNumber} · VAT registration number {business.vatNumber}.</p>
    <p>Head office: {business.headOffice}.</p>
    {logos.length>0&&<div className="trust-logos">{logos.map(logo=><SiteImage key={logo.name} src={logo.src} alt={logo.name} width={180} height={80}/>)}</div>}
  </div>;
}
