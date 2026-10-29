import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { articleInput, imageAlt, type Article, type Category } from "./schema";
import { bodyText, cleanHtml, excerpt } from "./html";
import { articleConfig, publicArticlesClient, databaseError } from "./client";
import {imageDescription} from '@/content/image-descriptions';
export const articleProjection =
  "id,title,slug,body,author,category_id,status,excerpt,expires_on,featured_image,featured_alt,homepage_featured,advice_pinned,created_at,updated_at,published_at,version";
const publicArticleProjection = `${articleProjection},article_tag_links(article_tags(name))` as const;
export function articleRecord(raw: Record<string, unknown>, publicPreview = false): Article {
  const fields = Object.fromEntries(
    Object.keys(articleInput.parse({})).map((k) => [k, raw[k]]),
  );
  return {
    ...articleInput.parse({
      ...fields,
      expires_on: raw.expires_on || "",
      featured_image: raw.featured_image || "",
      tags: raw.tags || (raw.article_tag_links as {article_tags: {name:string}|null}[] | undefined)?.flatMap(link => link.article_tags ? [link.article_tags.name] : []) || [],
    }),
    id: String(raw.id),
    body: cleanHtml(String(raw.body || "")),
    featured_alt:imageDescription(String(raw.featured_image||''),String(raw.featured_alt||'')),
    excerpt: String(raw.excerpt || "").trim() || (publicPreview ? excerpt(String(raw.body || "")) : ""),
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
    .select(publicArticleProjection)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  databaseError(r.error);
  return r.data ? articleRecord(r.data, true) : null;
}
export async function publicArticleList({
  q = "",
  category = "",
  page = 1,
  limit = 12,
  featured = false,
}: { q?: string; category?: string; page?: number; limit?: number; featured?: boolean } = {}) {
  const c = publicArticlesClient();
  if (!c)
    return {
      articles: [] as Article[],
      categories: [] as Category[],
      total: 0,
    };
  const request = () => {
    let req = c
      .from("articles")
      .select(publicArticleProjection, { count: "exact" })
      .eq("status", "published");
    if (category) req = req.eq("category_id", category);
    if (featured) req = req.eq("homepage_featured", true);
    else req = req.order("advice_pinned", {ascending:false});
    return req
      .order("published_at", { ascending: false })
      .order("id");
  };
  const search = normaliseSearch(q);
  if (search) {
    // Tags live in linked records, not an articles.tags column. Read through the
    // anonymous client's existing RLS, search the entire eligible collection,
    // then paginate matches; never search just the first visible results page.
    const matches: Article[] = [];
    const signal = AbortSignal.timeout(8000);
    for (let offset = 0; ; ) {
      const r = await request().range(offset, offset + 199).abortSignal(signal);
      databaseError(r.error);
      const rows = r.data || [];
      for (const raw of rows) {
        const article = articleRecord(raw, true);
        const text = bodyText(article.body.replace(/<(?:br\b[^>]*|\/(?:p|h[23]|li|blockquote|tr|td|th))>/gi, " "));
        if ([article.title, article.excerpt, text, ...article.tags].some(value => normaliseSearch(value).includes(search))) matches.push(article);
      }
      offset += rows.length;
      if (!rows.length || (r.count !== null ? offset >= r.count : rows.length < 200)) break;
    }
    return {articles: matches.slice((page - 1) * limit, page * limit), categories: await categories(c), total: matches.length};
  }
  const r = await request()
    .range((page - 1) * limit, page * limit - 1)
    .abortSignal(AbortSignal.timeout(8000));
  databaseError(r.error);
  return {
    articles: (r.data || []).map((raw) => articleRecord(raw, true)),
    categories: await categories(c),
    total: r.count || 0,
  };
}
function normaliseSearch(value: string) {
  return value.normalize("NFKC").replace(/\s+/g, " ").trim().toLocaleLowerCase("en-GB");
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
