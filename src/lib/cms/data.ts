import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Article, Category, Media } from './schema';
import { databaseError } from './security';
export { databaseError } from './security';
import { publicClient } from './client';
import { cmsConfig } from './config';
import { loadArticlePreviews } from './previews';
export async function homepageArticlePreviews() {
  const client=publicClient();const config=cmsConfig();if(!client||!config)return [];
  try {return await loadArticlePreviews(client,config.url);}
  catch {console.warn('Homepage article previews could not be loaded.');return [];}
}
export async function categories(client: SupabaseClient) {
  const result = await client.from('content_categories').select('*').order('name');
  databaseError(result.error); return result.data as Category[];
}
export async function mediaList(client: SupabaseClient) {
  const result = await client.from('content_media').select('*').order('created_at', {ascending: false}).limit(200);
  databaseError(result.error); return result.data as Media[];
}
export async function getArticle(client: SupabaseClient, id: string) {
  const result = await client.from('content_articles').select('*').eq('id',id).maybeSingle();
  databaseError(result.error); return result.data as Article | null;
}
export async function publishedArticles() {
  const client = publicClient(); if (!client) return [];
  const result = await client.from('content_articles').select('*').eq('status','published').order('published_at', {ascending: false});
  databaseError(result.error); return result.data as Article[];
}
export async function publishedArticle(slug: string) {
  const client = publicClient(); if (!client) return null;
  const result = await client.from('content_articles').select('*').eq('slug',slug).eq('status','published').maybeSingle();
  databaseError(result.error); return result.data as Article | null;
}
export async function publicMedia(client: SupabaseClient, id: string | null) {
  if (!id) return null;
  const result = await client.from('content_media').select('*').eq('id',id).maybeSingle();
  databaseError(result.error); return result.data as Media | null;
}
