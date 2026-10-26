import { LoginForm } from "@/components/articles/LoginForm";
export const metadata = {
  title: "Article administrator sign in",
  robots: { index: false, follow: false },
};
export default function Login() {
  return (
    <main id="main-content" className="article-admin">
      <h1>Sign in</h1>
      <p>Manage Planned by Jay articles.</p>
      <LoginForm />
    </main>
  );
}
