import { revalidatePath } from "next/cache";
import {
  writeClient,
  readJson,
  failure,
  ArticleError,
  databaseError,
} from "@/lib/articles/client";
import { articleInput, suggestSlug } from "@/lib/articles/schema";
import { cleanHtml, bodyText, excerpt } from "@/lib/articles/html";
export async function POST(request: Request) {
  try {
    const client = await writeClient(request);
    const parsed = articleInput.safeParse(await readJson(request));
    if (!parsed.success)
      throw new ArticleError(
        parsed.error.issues.map((i) => i.message).join(" "),
      );
    const value = parsed.data;
    value.body = cleanHtml(value.body);
    value.slug = value.slug || suggestSlug(value.title);
    if (value.status === "published" && (!value.title || !bodyText(value.body)))
      throw new ArticleError("Add a title and article text before publishing.");
    const { tags, ...article } = value;
    const result = await client.rpc("save_article", {
      p_article: { ...article, excerpt: excerpt(value.body) },
      p_tags: tags,
    });
    databaseError(result.error);
    for (const path of ["/", "/travel-advice", "/sitemap.xml"])
      revalidatePath(path);
    revalidatePath("/travel-advice/[slug]", "page");
    return Response.json(
      { article: result.data },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
export async function DELETE(request: Request) {
  try {
    const client = await writeClient(request);
    const p = articleInput
      .pick({ id: true, version: true })
      .safeParse(await readJson(request));
    if (!p.success || !p.data.id)
      throw new ArticleError("Choose an article to delete.");
    const r = await client
      .from("articles")
      .delete()
      .eq("id", p.data.id)
      .eq("version", p.data.version)
      .select("id");
    databaseError(r.error);
    if (!r.data?.length)
      throw new ArticleError(
        "The article changed or was deleted. Reload the list.",
        409,
      );
    for (const path of ["/", "/travel-advice", "/sitemap.xml"])
      revalidatePath(path);
    revalidatePath("/travel-advice/[slug]", "page");
    return Response.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}

export async function PATCH(request: Request) {
  try {
    const client = await writeClient(request);
    const p = articleInput
      .pick({ id: true, version: true, status: true })
      .safeParse(await readJson(request));
    if (!p.success || !p.data.id || p.data.status !== "draft")
      throw new ArticleError("Choose an article to return to draft.");
    const r = await client
      .from("articles")
      .update({ status: "draft" })
      .eq("id", p.data.id)
      .eq("version", p.data.version)
      .select("id");
    databaseError(r.error);
    if (!r.data?.length)
      throw new ArticleError(
        "The article changed. Reload before unpublishing.",
        409,
      );
    for (const path of ["/", "/travel-advice", "/sitemap.xml"])
      revalidatePath(path);
    revalidatePath("/travel-advice/[slug]", "page");
    return Response.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
