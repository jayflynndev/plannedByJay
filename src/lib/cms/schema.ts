import { z } from 'zod';
import { articleStatuses, contentTypes } from '@/content/cms';
const date = z.union([z.literal(''), z.iso.date()]).transform(value => value || null);
export const articleInput = z.object({
  id: z.uuid().nullable(), revision: z.number().int().min(0),
  title: z.string().trim().min(1).max(180),
  slug: z.string().max(140).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lower-case letters, numbers and single hyphens.'),
  excerpt: z.string().trim().max(500), body: z.string().max(200000),
  content_type: z.enum(contentTypes), category_id: z.uuid().nullable(), status: z.enum(articleStatuses),
  featured_media_id: z.uuid().nullable(), featured_alt: z.string().trim().max(300),
  seo_title: z.string().trim().max(180), seo_description: z.string().trim().max(500),
  canonical_url: z.union([z.literal(''), z.url({ protocol: /^https$/ })]),
  author: z.string().trim().max(120), research_date: date, fact_checked_date: date, review_date: date,
  sources: z.string().max(30000), notes: z.string().max(30000),
}).strict().superRefine((article, context) => {
  if (article.status !== 'published') return;
  for (const key of ['body', 'excerpt', 'author'] as const) {
    if (!article[key].trim()) context.addIssue({code: 'custom', path: [key], message: 'Complete this field before publishing.'});
  }
  if (article.featured_media_id && !article.featured_alt) context.addIssue({code: 'custom', path: ['featured_alt'], message: 'Describe the featured image before publishing.'});
});
export type ArticleInput = z.input<typeof articleInput>;
export type Article = Omit<z.output<typeof articleInput>, 'sources' | 'notes' | 'id'> & {
  id: string; created_at: string; updated_at: string; published_at: string | null; scheduled_at: string | null;
};
export type Category = { id: string; name: string };
export type Media = { id: string; storage_path: string; original_name: string; sha256: string; width: number; height: number; bytes: number; created_at: string };
export const slugify = (title: string) => title.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 140).replace(/-$/, '');
