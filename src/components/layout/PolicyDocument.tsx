import type { Policy } from '@/content/policies';
import { Container } from '@/components/ui/Container';

/** Presentation only. Public routes must pass through PolicyPage's approval check. */
export function PolicyDocument({ policy, children }: { policy: Policy; children?: React.ReactNode }) {
  return (
    <main id="main-content" tabIndex={-1} className="section policy-page">
      <Container>
        <h1>{policy.title}</h1>
        {policy.updatedAt && <p>Last updated: <time dateTime={policy.updatedAt}>{new Date(`${policy.updatedAt}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}</time></p>}
        {policy.sections.map(section => (
          <section key={section.heading}>
            <h2>{section.heading}</h2>
            {section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
            {section.technologies?.map(technology => (
              <div className="policy-technology" key={technology.name}>
                <h3>{technology.name}</h3>
                <dl>
                  <dt>Provider</dt><dd>{technology.provider}</dd>
                  <dt>Purpose</dt><dd>{technology.purpose}</dd>
                  <dt>Duration</dt><dd>{technology.duration}</dd>
                </dl>
              </div>
            ))}
            {section.links && <ul className="policy-links">{section.links.map(link => <li key={link.href}><a href={link.href}>{link.label}</a></li>)}</ul>}
          </section>
        ))}
        {children}
      </Container>
    </main>
  );
}
