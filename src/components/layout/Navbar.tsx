'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { Action } from '@/types/content';
import { Container } from '@/components/ui/Container';
export type NavbarProps = {
  links: readonly Action[];
  primaryAction: Action;
  brand: { name: string; descriptor: string };
};
/** RootLayout resolves content on the server and serialises one snapshot for hydration.
 * Do not import editable navigation values into this client module: separate module
 * versions during development must not override the values used for the server HTML.
 */
export function Navbar({ links, primaryAction, brand }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    function escape(event: KeyboardEvent) {
      if (event.key === 'Escape' && open) {
        setOpen(false);
        toggle.current?.focus();
      }
    }
    document.addEventListener('keydown', escape);
    const media = window.matchMedia('(min-width: 1024px)');
    function closeOnDesktop() {
      if (media.matches) setOpen(false);
    }
    media.addEventListener('change', closeOnDesktop);
    return () => {
      document.removeEventListener('keydown', escape);
      media.removeEventListener('change', closeOnDesktop);
    };
  }, [open]);
  return (
    <header className="site-header">
      <Container className="nav-container">
        <Link href="/" className="brand" onClick={() => setOpen(false)}>
          <span>
            {brand.name}
            <i aria-hidden="true">.</i>
          </span>
          <small>{brand.descriptor}</small>
        </Link>
        <button
          ref={toggle}
          className="menu-toggle"
          aria-expanded={open}
          aria-controls="main-navigation"
          onClick={() => setOpen(!open)}
        >
          {open ? 'Close' : 'Menu'}{' '}
          <span aria-hidden="true">{open ? '×' : '☰'}</span>
        </button>
        <nav
          id="main-navigation"
          aria-label="Main navigation"
          className={`navigation ${open ? 'is-open' : ''}`}
        >
          {links.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <Link
            className="nav-cta"
            href={primaryAction.href}
            onClick={() => setOpen(false)}
          >
            {primaryAction.label}
            <span aria-hidden="true">↗</span>
          </Link>
        </nav>
      </Container>
    </header>
  );
}
