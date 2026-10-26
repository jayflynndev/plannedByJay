import { notFound } from "next/navigation";
import { pageAdmin } from "@/lib/articles/client";
import { categories, getArticle, imageUrl } from "@/lib/articles/data";
import { ArticleEditor } from "@/components/articles/ArticleEditor";
import { z } from "zod";
export default async function EditArticle({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const c = await pageAdmin();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const article = await getArticle(c, id);
  if (!article) notFound();
  const tags = await c
    .from("article_tags")
    .select("name")
    .order("name")
    .limit(200);
  return (
    <ArticleEditor
      initial={article}
      initialImageUrl={imageUrl(article.featured_image) || ""}
      initialCategories={await categories(c)}
      existingTags={(tags.data || []).map((t) => t.name)}
    />
  );
}
