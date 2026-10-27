import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';
import './content.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { site } from '@/content/site';
import { navigation, primaryNavigation } from '@/content/navigation';
import {publicRobots} from '@/lib/indexing';
export function generateMetadata():Metadata {return {
  title: site.title,
  description: site.description,
  robots: publicRobots(),
};}
// Jay enables SITE_INDEXABLE only for the intended public production launch.
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
        <Analytics />
      </body>
    </html>
  );
}
