import {
  writeClient,
  readJson,
  failure,
  ArticleError,
} from "@/lib/articles/client";
import { articleInput } from "@/lib/articles/schema";
import { cleanHtml, excerpt } from "@/lib/articles/html";
export async function POST(request: Request) {
  try {
    await writeClient(request);
    const p = articleInput.safeParse(await readJson(request));
    if (!p.success)
      throw new ArticleError("Check the article fields before previewing.");
    return Response.json(
      {
        article: {
          ...p.data,
          body: cleanHtml(p.data.body),
          excerpt: excerpt(p.data.body),
        },
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
