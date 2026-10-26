import { pageAdmin, databaseError } from "@/lib/articles/client";
import { ArticleActions } from "@/components/articles/ArticleActions";
import { publicOrigin } from "@/lib/presentation";
export default async function ArticleDashboard({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const c = await pageAdmin();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const page = Math.max(
    1,
    Math.min(1000, Math.trunc(Number(params.page) || 1)),
  );
  let req = c
    .from("articles")
    .select(
      "id,title,slug,status,category_id,created_at,updated_at,version,expires_on,article_categories(name)",
      { count: "exact" },
    )
    .order("updated_at", { ascending: false })
    .range((page - 1) * 25, page * 25 - 1);
  if (q)
    req = req.ilike(
      "title",
      "%" + q.slice(0, 120).replace(/[\\%_*]/g, "") + "%",
    );
  const r = await req;
  databaseError(r.error);
  return (
    <>
      <div className="article-admin-heading">
        <h1>Articles</h1>
        <a className="button" href="/admin/articles/new">
          New Article
        </a>
      </div>
      <form method="get">
        <label>
          Search articles
          <input name="q" defaultValue={q} maxLength={120} />
        </label>
        <button type="submit" className="button button-secondary">
          Search
        </button>
      </form>
      <ul className="article-admin-list">
        {r.data?.map((a) => (
          <li key={a.id}>
            <h2>{a.title || "Untitled draft"}</h2>
            <p>
              {(a.article_categories as unknown as { name: string } | null)
                ?.name || "Travel advice"}{" "}
              - {a.status === "published" ? "Published" : "Draft"}
            </p>
            <p>
              Created{" "}
              {new Date(a.created_at).toLocaleDateString("en-GB", {
                timeZone: "Europe/London",
              })}{" "}
              - Updated{" "}
              {new Date(a.updated_at).toLocaleDateString("en-GB", {
                timeZone: "Europe/London",
              })}
            </p>
            <ArticleActions
              article={a}
              publicAvailable={
                !a.expires_on ||
                a.expires_on >=
                  new Intl.DateTimeFormat("en-CA", {
                    timeZone: "Europe/London",
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                  }).format(new Date())
              }
              publicUrl={publicOrigin() + "/travel-advice/" + a.slug}
            />
          </li>
        ))}
      </ul>
      {!r.data?.length && (
        <p>
          No articles match this search. Create a draft or clear the search.
        </p>
      )}
      <nav aria-label="Article list pages">
        {page > 1 && (
          <a
            href={
              "/admin/articles?" +
              new URLSearchParams({ q, page: String(page - 1) })
            }
          >
            Previous page
          </a>
        )}
        {page * 25 < (r.count || 0) && (
          <a
            href={
              "/admin/articles?" +
              new URLSearchParams({ q, page: String(page + 1) })
            }
          >
            Next page
          </a>
        )}
      </nav>
    </>
  );
}
