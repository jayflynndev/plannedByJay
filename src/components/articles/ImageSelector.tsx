"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { ArticleImage } from "@/lib/articles/schema";
export function ImageSelector({
  onSelect,
  onClose,
}: {
  onSelect: (image: ArticleImage) => void;
  onClose: () => void;
}) {
  const [images, setImages] = useState<ArticleImage[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [offset, setOffset] = useState(0),
    [hasMore, setHasMore] = useState(false);
  useEffect(() => {
    let active = true;
    fetch("/api/articles/media", { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        if (active) {
          setImages(d.images);
          setHasMore(!!d.hasMore);
          setOffset(d.images.length);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, []);
  return (
    <section
      className="article-image-selector"
      aria-label="Choose article photograph"
    >
      <h3>Photographs</h3>
      <p>Use only public photographs you have permission to share.</p>
      <label>
        Upload photograph
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={busy}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setBusy(true);
            setError("");
            const body = new FormData();
            body.set("file", file);
            try {
              const r = await fetch("/api/articles/media", {
                method: "POST",
                body,
              });
              const d = await r.json();
              if (!r.ok) throw new Error(d.error);
              setImages((v) => [d.image, ...v]);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Upload failed.");
            } finally {
              setBusy(false);
            }
          }}
        />
      </label>
      {busy && <p role="status">Uploading photograph...</p>}
      {error && <p role="alert">{error}</p>}
      <div className="article-image-grid">
        {images.map((i) => (
          <button
            type="button"
            aria-label={"Choose " + (i.alt || "photograph")}
            key={i.path}
            onClick={() => onSelect(i)}
          >
            <Image src={i.url} alt={i.alt} width={200} height={140} />
            <span>Choose {i.alt || "photograph"}</span>
          </button>
        ))}
      </div>
      {hasMore && (
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              const r = await fetch("/api/articles/media?offset=" + offset, {
                cache: "no-store",
              });
              const d = await r.json();
              if (!r.ok) throw new Error(d.error);
              setImages((v) => [
                ...v,
                ...d.images.filter(
                  (i: ArticleImage) => !v.some((x) => x.path === i.path),
                ),
              ]);
              setOffset((v) => v + d.images.length);
              setHasMore(!!d.hasMore);
            } catch (e) {
              setError(
                e instanceof Error
                  ? e.message
                  : "Could not load more photographs.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          More photographs
        </button>
      )}
      {!images.length && !error && <p>No uploaded photographs yet.</p>}
      <button
        type="button"
        className="button button-secondary"
        onClick={onClose}
      >
        Close photographs
      </button>
    </section>
  );
}
