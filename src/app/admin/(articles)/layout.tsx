import { pageAdmin } from "@/lib/articles/client";
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
      <nav aria-label="Article administration">
        <a href="/admin">Admin home</a>
        <a href="/admin/articles">Articles</a>
        <LogoutButton />
      </nav>
      {children}
    </main>
  );
}
