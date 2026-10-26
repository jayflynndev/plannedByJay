"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <form
      className="article-admin-form"
      aria-label="Administrator sign in"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        const form = new FormData(e.currentTarget);
        try {
          const r = await fetch("/api/articles/auth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: form.get("email"),
              password: form.get("password"),
            }),
          });
          const data = await r.json();
          if (!r.ok) throw new Error(data.error);
          router.replace("/admin");
          router.refresh();
        } catch (e) {
          setError(e instanceof Error ? e.message : "Sign-in failed.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <label>
        Business email
        <input
          name="email"
          type="email"
          defaultValue="jay@plannedbyjay.com"
          autoComplete="username"
          required
        />
      </label>
      <label>
        Password
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>
      <button className="button" disabled={busy}>
        {busy ? "Signing in..." : "Sign in"}
      </button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
export function LogoutButton() {
  const router = useRouter();
  const [error, setError] = useState("");
  return (
    <>
      <button
        type="button"
        onClick={async () => {
          try {
            const r = await fetch("/api/articles/auth", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "logout" }),
            });
            if (!r.ok) throw new Error();
            router.replace("/admin/login");
            router.refresh();
          } catch {
            setError("Sign-out failed. Please try again.");
          }
        }}
      >
        Sign out
      </button>
      {error && <span role="alert">{error}</span>}
    </>
  );
}
