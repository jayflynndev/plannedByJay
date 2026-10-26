import {
  writeClient,
  readJson,
  failure,
  ArticleError,
  databaseError,
} from "@/lib/articles/client";
import { normaliseName } from "@/lib/articles/schema";
export async function POST(request: Request) {
  try {
    const c = await writeClient(request);
    const body = await readJson(request);
    if (
      typeof body.name !== "string" ||
      !body.name.trim() ||
      body.name.trim().length > 80
    )
      throw new ArticleError("Use a category name of 1 to 80 characters.");
    const name = body.name.trim().replace(/\s+/g, " ");
    const result = await c
      .from("article_categories")
      .upsert(
        { name },
        { onConflict: "normalised_name", ignoreDuplicates: true },
      );
    databaseError(result.error);
    const row = await c
      .from("article_categories")
      .select("id,name")
      .eq("normalised_name", normaliseName(name))
      .single();
    databaseError(row.error);
    return Response.json(
      { category: row.data },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
