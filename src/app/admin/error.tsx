"use client";
export default function AdminError({ reset }: { reset: () => void }) {
  return (
    <main id="main-content" className="article-admin">
      <h1>Articles are unavailable</h1>
      <p>
        Check the Articles setup, or try again. No unsaved article has been
        published.
      </p>
      <button className="button" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
