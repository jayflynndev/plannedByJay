import { notFound } from 'next/navigation';
import { policies,type PolicyKey } from '@/content/policies';
import { Container } from '@/components/ui/Container';
export function PolicyPage({policy: key}:{policy:PolicyKey}) {
  const policy=policies[key];if(!policy.approved||!policy.sections.length)notFound();
  return <main id="main-content" tabIndex={-1} className="section policy-page"><Container><h1>{policy.title}</h1>{policy.updatedAt&&<p>Last updated: <time dateTime={policy.updatedAt}>{policy.updatedAt}</time></p>}{policy.sections.map(section=><section key={section.heading}><h2>{section.heading}</h2>{section.paragraphs.map(paragraph=><p key={paragraph}>{paragraph}</p>)}</section>)}</Container></main>;
}
