import { z } from "zod";
export const ADMIN_EMAIL = "jay@plannedbyjay.com";
export const imagePath = z
  .string()
  .regex(/^[a-f0-9-]{36}-[a-z0-9-]{1,80}\.webp$/);
export const articleInput = z
  .object({
    id: z.uuid().nullable().default(null),
    version: z.number().int().nonnegative().default(0),
    title: z.string().trim().max(180).default(""),
    slug: z
      .string()
      .max(60)
      .regex(/^(?:[a-z0-9]+(?:-[a-z0-9]+)*)?$/)
      .default(""),
    excerpt: z.string().trim().max(200).default(""),
    body: z.string().max(150000).default(""),
    author: z.string().trim().max(120).default("Jay"),
    category_id: z.uuid().nullable().default(null),
    tags: z.array(z.string().trim().min(1).max(50)).max(20).default([]),
    expires_on: z.union([z.literal(""), z.iso.date()]).default(""),
    featured_image: z.union([z.literal(""), imagePath]).default(""),
    featured_alt: z.string().trim().max(300).default(""),
    homepage_featured: z.boolean().default(false),
    advice_pinned: z.boolean().default(false),
    status: z.enum(["draft", "published"]).default("draft"),
  })
  .strict();
export type ArticleInput = z.output<typeof articleInput>;
export type Article = ArticleInput & {
  id: string;
  excerpt: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};
export type Category = { id: string; name: string };
export type ArticleImage = { path: string; url: string; alt: string };
export function emptyArticle(): ArticleInput {
  return articleInput.parse({});
}
export const normaliseName = (name: string) =>
  name.trim().replace(/\s+/g, " ").toLowerCase();
export function slugWords(text: string) {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['\u2019]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
export function suggestSlug(title: string) {
  const s = slugWords(title);
  if (/travel-agent/.test(s) && /expensive|cost/.test(s))
    return "travel-agent-costs";
  if (/first-cruise/.test(s)) return "first-cruise-guide";
  if (/all-inclusive/.test(s) && /self-catering/.test(s))
    return "all-inclusive-vs-self-catering";
  if (/accessible/.test(s) && /holiday/.test(s))
    return "accessible-holiday-guide";
  const stop = new Set([
    "a",
    "an",
    "the",
    "is",
    "are",
    "does",
    "do",
    "what",
    "whats",
    "how",
    "your",
    "our",
    "to",
    "in",
    "on",
    "for",
    "through",
    "planning",
    "booking",
  ]);
  return (
    s
      .split("-")
      .filter((w) => !stop.has(w))
      .slice(0, 6)
      .join("-")
      .slice(0, 60)
      .replace(/-$/, "") || "article"
  );
}
export function imageAlt(path: string) {
  return path
    .replace(/^[a-f0-9-]{36}-/, "")
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .trim();
}
