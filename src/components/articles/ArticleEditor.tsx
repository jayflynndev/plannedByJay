"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  emptyArticle,
  articleInput,
  suggestSlug,
  normaliseName,
  type Article,
  type ArticleInput,
  type Category,
} from "@/lib/articles/schema";
import { VisualEditor } from "./VisualEditor";
import { ImageSelector } from "./ImageSelector";
import { ArticleView } from "./ArticleView";
export function ArticleEditor({
  initial,
  initialCategories,
  existingTags = [],
  initialImageUrl = "",
}: {
  initial?: Article;
  initialCategories: Category[];
  existingTags?: string[];
  initialImageUrl?: string;
}) {
  const [value, setValue] = useState<ArticleInput>(
      () => initial || emptyArticle(),
    ),
    [baseline, setBaseline] = useState(() =>
      JSON.stringify(initial || emptyArticle()),
    ),
    [saved, setSaved] = useState(initial),
    [categories, setCategories] = useState(initialCategories),
    [newCategory, setNewCategory] = useState(""),
    [creatingCategory, setCreatingCategory] = useState(false),
    [categoryName, setCategoryName] = useState(""),
    [categoryError, setCategoryError] = useState(""),
    [tag, setTag] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [failed, setFailed] = useState(false),
    [photos, setPhotos] = useState(false),
    [imageUrl, setImageUrl] = useState(initialImageUrl),
    [preview, setPreview] = useState<
      (ArticleInput & { excerpt: string }) | null
    >(null);
  const locked = !!saved?.published_at,
    dirty = JSON.stringify(value) !== baseline,
    slugEdited = useRef(!!initial?.slug),
    saving = useRef(false);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function change<K extends keyof ArticleInput>(key: K, next: ArticleInput[K]) {
    setValue((v) => ({
      ...v,
      [key]: next,
      ...(key === "title" && !locked && !slugEdited.current
        ? { slug: suggestSlug(String(next)) }
        : {}),
    }));
    setMessage("");
  }
  async function category() {
    if (!newCategory.trim()) return;
    setCreatingCategory(true);
    setCategoryError("");
    try {
      const r = await fetch("/api/articles/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategory }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setCategories((v) =>
        [...v.filter((c) => c.id !== d.category.id), d.category].sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
      );
      change("category_id", d.category.id);
      setNewCategory("");
      setCategoryName("");
    } catch (e) {
      setCategoryError(
        e instanceof Error
          ? e.message
          : "Category creation failed. Your article is retained.",
      );
    } finally {
      setCreatingCategory(false);
    }
  }
  function addTag() {
    const next = tag.trim().replace(/\s+/g, " ");
    if (!next) return;
    if (next.length > 50 || value.tags.length >= 20) {
      setFailed(true);
      setMessage("Use tags up to 50 characters, with at most 20 per article.");
      return;
    }
    if (!value.tags.some((t) => normaliseName(t) === normaliseName(next)))
      change("tags", [...value.tags, next]);
    setTag("");
  }
  async function save(status: ArticleInput["status"], isPreview = false) {
    if (saving.current) return;
    saving.current = true;
    setBusy(true);
    setMessage("");
    try {
      const payload = {
        ...Object.fromEntries(
          Object.keys(emptyArticle()).map((k) => [
            k,
            value[k as keyof ArticleInput],
          ]),
        ),
        status,
      };
      const r = await fetch(
        isPreview ? "/api/articles/preview" : "/api/articles",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      if (isPreview) {
        setPreview(d.article);
        setMessage(
          "Private preview of your current text; nothing was published.",
        );
      } else {
        const next = articleInput.parse({
          ...Object.fromEntries(
            Object.keys(emptyArticle()).map((k) => [k, d.article[k]]),
          ),
          expires_on: d.article.expires_on || "",
          featured_image: d.article.featured_image || "",
        });
        setValue(next);
        setSaved({ ...d.article, ...next });
        setBaseline(JSON.stringify(next));
        slugEdited.current = true;
        window.history.replaceState(
          null,
          "",
          "/admin/articles/" + next.id + "/edit",
        );
        const today = new Intl.DateTimeFormat("en-CA", {
          timeZone: "Europe/London",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date());
        setMessage(
          status === "published"
            ? next.expires_on && next.expires_on < today
              ? "Saved as published, but the expiry date has passed so this article is not public."
              : "Article published."
            : "Draft saved privately.",
        );
      }
      setFailed(false);
    } catch (e) {
      setFailed(true);
      setMessage(
        e instanceof Error ? e.message : "Save failed. Your work is retained.",
      );
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }
  return (
    <>
      <div className="article-admin-heading">
        <h1>{value.id ? "Edit article" : "New Article"}</h1>
        <a href="/admin/articles">All Articles</a>
      </div>
      <p>
        {dirty ? "Unsaved changes" : "Saved"}
        {saved
          ? " - Created " +
            new Date(saved.created_at).toLocaleDateString("en-GB", {
              timeZone: "Europe/London",
            }) +
            " - Updated " +
            new Date(saved.updated_at).toLocaleDateString("en-GB", {
              timeZone: "Europe/London",
            })
          : " - Not saved yet"}
      </p>
      {message && (
        <p
          role={failed ? "alert" : "status"}
          className={failed ? "article-admin-error" : "article-admin-notice"}
        >
          {message}
        </p>
      )}
      <fieldset disabled={busy} className="article-admin-form">
        <label>
          Article title
          <input
            value={value.title}
            maxLength={180}
            onChange={(e) => change("title", e.target.value)}
          />
        </label>
        <details>
          <summary>Article URL (optional)</summary>
          <label>
            URL slug
            <input
              value={value.slug}
              maxLength={60}
              readOnly={locked}
              onChange={(e) => {
                slugEdited.current = true;
                change("slug", e.target.value);
              }}
            />
          </label>
          <p>
            {locked
              ? "This published URL stays unchanged, even if you edit the title."
              : "A short URL is suggested from your title. You can correct it before first publication."}
          </p>
        </details>
        <label>
          Category
          <select
            value={value.category_id || ""}
            onChange={(e) => {
              if (e.target.value === "__new") setCategoryName("new");
              else change("category_id", e.target.value || null);
            }}
          >
            <option value="">Travel advice (default)</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
            <option value="__new">+ Create new category</option>
          </select>
        </label>
        {categoryName && (
          <div className="article-inline-category">
            <label>
              New category name
              <input
                value={newCategory}
                maxLength={80}
                onChange={(e) => setNewCategory(e.target.value)}
              />
            </label>
            <button
              type="button"
              disabled={creatingCategory}
              onClick={() => void category()}
            >
              {creatingCategory ? "Saving category..." : "Create category"}
            </button>
            <button type="button" onClick={() => setCategoryName("")}>
              Cancel
            </button>
            {categoryError && <p role="alert">{categoryError}</p>}
          </div>
        )}
        <div>
          <h2>Article body</h2>
          <VisualEditor
            value={value.body}
            onChange={(body) => change("body", body)}
            disabled={busy}
          />
        </div>
        <label>
          Author
          <input
            value={value.author}
            maxLength={120}
            onChange={(e) => change("author", e.target.value)}
          />
        </label>
        <label>
          Expiry date (optional)
          <input
            type="date"
            value={value.expires_on}
            onChange={(e) => change("expires_on", e.target.value)}
          />
        </label>
        <p>
          An expiry date keeps the article public through that date in UK time.
          Leave blank for no expiry.
        </p>
        <div>
          <label>
            Tags
            <input
              value={tag}
              list="article-existing-tags"
              maxLength={50}
              onChange={(e) => setTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
            />
          </label>
          <datalist id="article-existing-tags">
            {existingTags.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
          <button type="button" onClick={addTag}>
            Add tag
          </button>
          <div className="article-tags">
            {value.tags.map((t) => (
              <button
                type="button"
                key={t}
                onClick={() =>
                  change(
                    "tags",
                    value.tags.filter((x) => x !== t),
                  )
                }
              >
                {t} <span aria-hidden="true">x</span>
                <span className="sr-only">Remove tag</span>
              </button>
            ))}
          </div>
        </div>
        <section>
          <h2>Featured photograph (optional)</h2>
          {value.featured_image && imageUrl && (
            <Image
              src={imageUrl}
              alt={value.featured_alt}
              width={320}
              height={220}
            />
          )}
          <div className="article-admin-actions">
            <button type="button" onClick={() => setPhotos(true)}>
              Choose or upload photograph
            </button>
            {value.featured_image && (
              <button
                type="button"
                onClick={() => {
                  change("featured_image", "");
                  change("featured_alt", "");
                  setImageUrl("");
                }}
              >
                Remove photograph
              </button>
            )}
          </div>
          {photos && (
            <ImageSelector
              onClose={() => setPhotos(false)}
              onSelect={(i) => {
                change("featured_image", i.path);
                change("featured_alt", i.alt || value.title);
                setImageUrl(i.url);
                setPhotos(false);
              }}
            />
          )}
          {value.featured_image && (
            <label>
              Image description (optional; review the suggestion)
              <input
                value={value.featured_alt}
                maxLength={300}
                onChange={(e) => change("featured_alt", e.target.value)}
              />
            </label>
          )}
        </section>
        <div className="article-admin-actions">
          <button
            type="button"
            className="button button-secondary"
            onClick={() => void save("draft")}
          >
            Save Draft
          </button>
          <button
            type="button"
            className="button button-secondary"
            onClick={() => void save(value.status, true)}
          >
            Preview
          </button>
          <button
            type="button"
            className="button"
            onClick={() => void save("published")}
          >
            Publish
          </button>
        </div>
        <p>
          Save Draft keeps the article private (including returning a published
          article to draft). Preview does not save or publish. Save regularly;
          there is no background autosave.
        </p>
      </fieldset>
      {preview && (
        <section
          className="article-private-preview"
          aria-label="Private article preview"
        >
          <button
            type="button"
            className="button button-secondary"
            onClick={() => setPreview(null)}
          >
            Close preview
          </button>
          <p>Private preview - not published by this action.</p>
          <ArticleView
            article={{
              ...preview,
              content_type: "Travel advice",
              published_at: saved?.published_at,
            }}
            category={
              categories.find((c) => c.id === preview.category_id)?.name ||
              "Travel advice"
            }
            media={
              preview.featured_image && imageUrl
                ? { src: imageUrl, width: 1200, height: 800 }
                : null
            }
          />
        </section>
      )}
    </>
  );
}
