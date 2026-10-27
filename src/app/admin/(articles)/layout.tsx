import { pageAdmin } from "@/lib/articles/client";
import Link from 'next/link';
import { LogoutButton } from "@/components/articles/LoginForm";
export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await pageAdmin();
  return (
    <main id="main-content" className="article-admin">
      <nav aria-label="Website administration">
        <a href="/admin">Admin home</a>
        <a href="/admin/articles">Articles</a>
        <a href="/admin/holiday-types">Holiday Types</a>
        <a href="/admin/suppliers">Suppliers</a>
        <a href="/admin/holiday-offers">Holiday Offers</a>
        <a href="/admin/offer-enquiries">Offer enquiries</a>
        <Link href="/admin/bespoke-enquiries">Bespoke Enquiries</Link>
        <LogoutButton />
      </nav>
      {children}
    </main>
  );
}
