import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { databaseError } from './security';
import { imageUrl } from './urls';
export type ArticlePreview = {
  id:string;title:string;slug:string;excerpt:string;content_type:string;
  image:{src:string;alt:string;width:number;height:number}|null;
};
/** Anonymous client only. Small projection deliberately excludes body/editorial data. */
export async function loadArticlePreviews(client:SupabaseClient,mediaBase:string):Promise<ArticlePreview[]> {
  const signal=AbortSignal.timeout(5000);
  const articles=await client.from('content_articles')
    .select('id,title,slug,excerpt,content_type,status,featured_media_id,featured_alt')
    .eq('status','published').order('published_at',{ascending:false}).order('updated_at',{ascending:false}).limit(3).abortSignal(signal);
  databaseError(articles.error);
  const published=(articles.data||[]).filter(article=>article.status==='published').slice(0,3);
  const ids=[...new Set(published.flatMap(article=>article.featured_media_id?[article.featured_media_id]:[]))];
  const media=ids.length?await client.from('content_media').select('id,storage_path,width,height').in('id',ids).abortSignal(signal):{data:[],error:null};
  databaseError(media.error);
  return published.map(article=>{
    const photo=media.data?.find(item=>item.id===article.featured_media_id);
    return {id:article.id,title:article.title,slug:article.slug,excerpt:article.excerpt,content_type:article.content_type,
      image:photo?{src:imageUrl(mediaBase,photo.storage_path),alt:article.featured_alt,width:photo.width,height:photo.height}:null};
  });
}
