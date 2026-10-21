import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { site } from '@/content/site';
import { navigation, primaryNavigation } from '@/content/navigation';
export const metadata: Metadata = {
  title: site.title,
  description: site.description,
  robots: { index: false, follow: false },
};
// Development indexing is disabled until real contact and approved business information are ready.
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <Navbar
          links={navigation}
          primaryAction={primaryNavigation}
          brand={{ name: site.name, descriptor: site.descriptor }}
        />
        {children}
        <Footer />
      </body>
    </html>
  );
}
