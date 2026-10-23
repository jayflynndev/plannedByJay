import { pageAdmin } from '@/lib/cms/client';
import { SignOut } from '@/components/cms/AuthForm';
export default async function PortalLayout({children}:{children:React.ReactNode}) {
  await pageAdmin();
  return <main id="main-content" className="cms cms-shell">
    <nav className="cms-nav" aria-label="Content management"><a href="/admin">Overview</a><a href="/admin/articles">Articles</a><a href="/admin/holiday-offers">Holiday offers</a><a href="/admin/suppliers">Suppliers</a><a href="/admin/media">Images</a><a href="/admin/categories">Categories</a><SignOut/></nav>
    {children}
  </main>;
}
