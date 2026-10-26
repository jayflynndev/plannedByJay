import { preparePhoto } from "@/lib/articles/media";
import { randomUUID } from "node:crypto";
import {
  adminClient,
  writeClient,
  failure,
  ArticleError,
} from "@/lib/articles/client";
import { imageLibrary, imageUrl } from "@/lib/articles/data";
import { imageAlt, slugWords } from "@/lib/articles/schema";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const c = await adminClient();
    const offset = Number(new URL(request.url).searchParams.get("offset") || 0);
    if (!Number.isInteger(offset) || offset < 0 || offset > 100000)
      throw new ArticleError("Invalid photo page.");
    const images = await imageLibrary(c, offset);
    return Response.json(
      { images, hasMore: images.length === 100 },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  try {
    const c = await writeClient(request);
    if (Number(request.headers.get("content-length")) > 4.4 * 1024 * 1024)
      throw new ArticleError("Choose a photo smaller than 4 MB.", 413);
    const form = await request.formData();
    const file = form.get("file");
    if (
      !(file instanceof File) ||
      file.size > 4 * 1024 * 1024 ||
      !["image/jpeg", "image/png", "image/webp"].includes(file.type)
    )
      throw new ArticleError("Choose a JPG, PNG or WebP smaller than 4 MB.");
    let bytes: Buffer;
    try {
      bytes = await preparePhoto(Buffer.from(await file.arrayBuffer()));
    } catch {
      throw new ArticleError("This file is not a supported photograph.");
    }
    const name =
      slugWords(file.name.replace(/\.[^.]+$/, "")).slice(0, 80) || "photograph";
    const path = randomUUID() + "-" + name + ".webp";
    const r = await c.storage
      .from("article-images")
      .upload(path, bytes, { contentType: "image/webp", upsert: false });
    if (r.error)
      throw new ArticleError(
        "Photo upload failed. Check the article-images bucket and permissions.",
        503,
      );
    return Response.json(
      { image: { path, url: imageUrl(path), alt: imageAlt(path) } },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
