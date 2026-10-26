import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { articleInput, imageAlt, type Article, type Category } from "./schema";
import { cleanHtml, excerpt } from "./html";
import { articleConfig, publicArticlesClient, databaseError } from "./client";
export const articleProjection =
  "id,title,slug,body,author,category_id,status,excerpt,expires_on,featured_image,featured_alt,created_at,updated_at,published_at,version";
export function articleRecord(raw: Record<string, unknown>): Article {
  const fields = Object.fromEntries(
    Object.keys(articleInput.parse({})).map((k) => [k, raw[k]]),
  );
  return {
    ...articleInput.parse({
      ...fields,
      expires_on: raw.expires_on || "",
      featured_image: raw.featured_image || "",
      tags: raw.tags || [],
    }),
    id: String(raw.id),
    body: cleanHtml(String(raw.body || "")),
    excerpt: excerpt(String(raw.body || "")),
    created_at: String(raw.created_at),
    updated_at: String(raw.updated_at),
    published_at: raw.published_at ? String(raw.published_at) : null,
  };
}
export function imageUrl(path: string) {
  return path && articleConfig()
    ? articleConfig()!.url +
        "/storage/v1/object/public/article-images/" +
        encodeURIComponent(path)
    : null;
}
export async function categories(client: SupabaseClient) {
  const r = await client
    .from("article_categories")
    .select("id,name")
    .order("name");
  databaseError(r.error);
  return (r.data || []) as Category[];
}
export async function getArticle(client: SupabaseClient, id: string) {
  const r = await client
    .from("articles")
    .select(articleProjection)
    .eq("id", id)
    .maybeSingle();
  databaseError(r.error);
  if (!r.data) return null;
  const tags = await client
    .from("article_tag_links")
    .select("article_tags(name)")
    .eq("article_id", id);
  databaseError(tags.error);
  return articleRecord({
    ...r.data,
    tags: (tags.data || []).flatMap((t) => {
      const tag = t.article_tags as unknown as { name: string } | null;
      return tag ? [tag.name] : [];
    }),
  });
}
export async function publicArticle(slug: string) {
  const c = publicArticlesClient();
  if (!c) return null;
  const r = await c
    .from("articles")
    .select(articleProjection)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  databaseError(r.error);
  return r.data ? articleRecord(r.data) : null;
}
export async function publicArticleList({
  q = "",
  category = "",
  page = 1,
  limit = 12,
}: { q?: string; category?: string; page?: number; limit?: number } = {}) {
  const c = publicArticlesClient();
  if (!c)
    return {
      articles: [] as Article[],
      categories: [] as Category[],
      total: 0,
    };
  let req = c
    .from("articles")
    .select(articleProjection, { count: "exact" })
    .eq("status", "published");
  if (q) req = req.ilike("title", "%" + q.replace(/[\\%_*]/g, "") + "%");
  if (category) req = req.eq("category_id", category);
  const r = await req
    .order("published_at", { ascending: false })
    .order("id")
    .range((page - 1) * limit, page * limit - 1)
    .abortSignal(AbortSignal.timeout(8000));
  databaseError(r.error);
  return {
    articles: (r.data || []).map(articleRecord),
    categories: await categories(c),
    total: r.count || 0,
  };
}
export async function imageLibrary(client: SupabaseClient, offset = 0) {
  const r = await client.storage
    .from("article-images")
    .list("", {
      limit: 100,
      offset,
      sortBy: { column: "created_at", order: "desc" },
    });
  databaseError(r.error);
  return (r.data || [])
    .filter((f) => f.id)
    .map((f) => ({
      path: f.name,
      url: imageUrl(f.name)!,
      alt: imageAlt(f.name),
    }));
}
export function displayArticle(a: Article) {
  return { ...a, content_type: "Travel advice" };
}
