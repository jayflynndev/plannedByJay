import Link from 'next/link';
import type { Action } from '@/types/content';
export function Button({ label, href, secondary = false }: Action & { secondary?: boolean }) {
  return <Link className={`button ${secondary ? 'button-secondary' : ''}`} href={href}>{label}<span aria-hidden="true">↗</span></Link>;
}
