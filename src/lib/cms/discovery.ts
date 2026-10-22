import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import type { DiscoveryQuery } from './discovery-query';
import { imageUrl } from './urls';
const option=z.object({id:z.uuid(),name:z.string()});
const card=z.object({
  id:z.uuid(),title:z.string(),slug:z.string().max(140).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),excerpt:z.string(),
  content_type:z.string(),category_id:z.uuid().nullable(),featured_media_id:z.uuid().nullable(),featured_alt:z.string(),
  published_at:z.string().nullable(),advice_pinned:z.boolean(),
});
const response=z.object({total:z.number().int().nonnegative(),articles:z.array(card).max(12)});
export type DiscoveryCard=z.infer<typeof card>&{image:{src:string;width:number;height:number}|null};
export type DiscoveryResults={total:number;articles:DiscoveryCard[];categories:z.infer<typeof option>[];tags:z.infer<typeof option>[]};
/** Always use an anonymous client here, including when a signed-in admin browses publicly. */
export async function loadDiscovery(client:SupabaseClient|null,base:string,query:DiscoveryQuery):Promise<DiscoveryResults> {
  if(!client)throw new Error('discovery_unconfigured');
  const signal=AbortSignal.timeout(5000);
  const [search,categories,tags]=await Promise.all([
    client.rpc('search_content_articles',{p_query:query.q,p_type:query.type,p_category:query.category||null,p_tag:query.tag||null,p_page:query.page}).abortSignal(signal),
    client.from('content_categories').select('id,name').order('name').limit(100).abortSignal(signal),
    client.rpc('public_article_tags').abortSignal(signal),
  ]);
  if(search.error||categories.error||tags.error)throw new Error('discovery_unavailable');
  const data=response.parse(search.data);
  const ids=[...new Set(data.articles.flatMap(article=>article.featured_media_id?[article.featured_media_id]:[]))];
  const media=ids.length?await client.from('content_media').select('id,storage_path,width,height').in('id',ids).abortSignal(signal):{data:[],error:null};
  if(media.error)throw new Error('discovery_media_unavailable');
  return {total:data.total,categories:z.array(option).max(100).parse(categories.data),tags:z.array(option).max(100).parse(tags.data),
    articles:data.articles.map(article=>{
      const photo=media.data?.find(image=>image.id===article.featured_media_id);
      return {...article,image:photo?{src:imageUrl(base,photo.storage_path),width:photo.width,height:photo.height}:null};
    })};
}
