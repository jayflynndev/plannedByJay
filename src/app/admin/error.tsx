"use client";
export default function AdminError({ reset }: { reset: () => void }) {
  return (
    <main id="main-content" className="article-admin">
      <h1>Administration is unavailable</h1>
      <p>
        Check the relevant Articles, Holiday Types or Suppliers SQL setup, or try again.
        No unsaved content has been published.
      </p>
      <button className="button" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
