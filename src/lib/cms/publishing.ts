import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { articleInput, type Article } from './schema';
import { databaseError, CmsError } from './security';
import { articlePaths } from './urls';
export async function saveArticle(client:SupabaseClient,input:unknown,invalidate:(path:string,type?:'page')=>void) {
  const parsed=articleInput.safeParse(input);
  if(!parsed.success) throw new CmsError('Complete the required article fields before publishing. Open the editor to review them.');
  const registry=await client.from('content_types').select('name').eq('name',parsed.data.content_type).maybeSingle();
  databaseError(registry.error);if(!registry.data)throw new CmsError('Choose an existing content type or create one in the article editor.');
  const {sources,notes,revision,...article}=parsed.data;
  const result=await client.rpc('cms_save_article',{p_article:article,p_sources:sources,p_notes:notes,p_revision:revision,p_media_ids:[]});
  databaseError(result.error);const saved=result.data as Article;
  for(const path of articlePaths([saved.slug]))invalidate(path);
  // Old redirects/unpublished URLs also change. Revalidate the full article pattern;
  // public fetches additionally use no-store, so revocation never depends on ISR expiry.
  invalidate('/travel-advice/[slug]','page');
  return saved;
}
