"use client";
import { useState } from "react";
export function ArticleActions({
  article,
  publicUrl,
  publicAvailable = true,
}: {
  article: { id: string; title: string; status: string; version: number };
  publicUrl: string;
  publicAvailable?: boolean;
}) {
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <div className="article-admin-actions">
      <a href={"/admin/articles/" + article.id + "/edit"}>Edit</a>
      {article.status === "published" && (
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              const r = await fetch("/api/articles", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  id: article.id,
                  version: article.version,
                  status: "draft",
                }),
              });
              const d = await r.json();
              if (!r.ok) throw new Error(d.error);
              window.location.reload();
            } catch (e) {
              setMessage(e instanceof Error ? e.message : "Unpublish failed.");
              setBusy(false);
            }
          }}
        >
          Return to Draft
        </button>
      )}
      {article.status === "published" && publicAvailable && (
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(publicUrl);
              setMessage("Link copied.");
            } catch {
              setMessage("Copy this link: " + publicUrl);
            }
          }}
        >
          Copy Link
        </button>
      )}
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          if (!window.confirm("Delete this article? This cannot be undone."))
            return;
          setBusy(true);
          try {
            const r = await fetch("/api/articles", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: article.id,
                version: article.version,
              }),
            });
            const d = await r.json();
            if (!r.ok) throw new Error(d.error);
            window.location.reload();
          } catch (e) {
            setMessage(e instanceof Error ? e.message : "Delete failed.");
            setBusy(false);
          }
        }}
      >
        Delete
      </button>
      {message && <p role="status">{message}</p>}
    </div>
  );
}
