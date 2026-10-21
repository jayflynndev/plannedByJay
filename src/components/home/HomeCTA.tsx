import { home } from '@/content/home';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
/** CTA copy and destination: src/content/home.ts. The enquiry page owns submission availability. */
export function HomeCTA() {
  return (
    <section id="plan" className="section cta">
      <Container>
        <p className="eyebrow">{home.cta.eyebrow}</p>
        <h2>{home.cta.title}</h2>
        <p className="intro">{home.cta.description}</p>
        <Button label={home.cta.button} href={home.cta.href} />
      </Container>
    </section>
  );
}
