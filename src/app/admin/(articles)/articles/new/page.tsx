import { pageAdmin } from "@/lib/articles/client";
import { categories } from "@/lib/articles/data";
import { ArticleEditor } from "@/components/articles/ArticleEditor";
export default async function NewArticle() {
  const c = await pageAdmin();
  const tags = await c
    .from("article_tags")
    .select("name")
    .order("name")
    .limit(200);
  return (
    <ArticleEditor
      initialCategories={await categories(c)}
      existingTags={(tags.data || []).map((t) => t.name)}
    />
  );
}
