import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import type { HolidayType } from '@/content/holiday-types';
import type { ArticlePreview } from './previews';
import { imageUrl } from './urls';
const option=z.object({id:z.uuid(),name:z.string()});
const preview=z.object({id:z.uuid(),title:z.string(),slug:z.string().max(140).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),excerpt:z.string(),content_type:z.string(),status:z.string(),featured_media_id:z.uuid().nullable(),featured_alt:z.string(),published_at:z.string().nullable()});
const normalise=(name:string)=>name.trim().replace(/\s+/g,' ').toLowerCase();
/** Anonymous/RLS access only; match named taxonomy, never broad keyword guesses.
 * Every article query has a small projection and limit, including empty matches.
 * Public client fetches are no-store: edits/unpublishing take effect next request.
 */
export async function holidayReading(client:SupabaseClient|null,base:string,related:HolidayType['related']):Promise<ArticlePreview[]> {
  if(!client)return [];
  const signal=AbortSignal.timeout(5000);
  const [tags,categories]=await Promise.all([
    related.tags.length?client.rpc('public_article_tags').abortSignal(signal):{data:[],error:null},
    related.categories.length?client.from('content_categories').select('id,name').order('name').limit(100).abortSignal(signal):{data:[],error:null},
  ]);
  if(tags.error||categories.error)throw new Error('holiday_reading_unavailable');
  const matching=(data:unknown,names:string[])=>z.array(option).max(100).parse(data).filter(row=>names.map(normalise).includes(normalise(row.name))).map(row=>row.id);
  const tagIds=matching(tags.data,related.tags),categoryIds=matching(categories.data,related.categories);
  const select='id,title,slug,excerpt,content_type,status,featured_media_id,featured_alt,published_at';
  const query=(projection=select)=>client.from('content_articles').select(projection).eq('status','published').order('published_at',{ascending:false}).order('id').limit(3).abortSignal(signal);
  const results=await Promise.all([
    ...(tagIds.length?[query(`${select},content_article_tags!inner(tag_id)`).in('content_article_tags.tag_id',tagIds)]:[]),
    ...(categoryIds.length?[query().in('category_id',categoryIds)]:[]),
    ...(related.contentTypes.length?[query().in('content_type',related.contentTypes)]:[]),
  ]);
  if(results.some(result=>result.error))throw new Error('holiday_reading_unavailable');
  const rows=z.array(preview).parse(results.flatMap(result=>result.data||[])).filter(row=>row.status==='published');
  const articles=[...new Map(rows.map(row=>[row.id,row])).values()].sort((a,b)=>(b.published_at||'').localeCompare(a.published_at||'')||a.id.localeCompare(b.id)).slice(0,3);
  const ids=[...new Set(articles.flatMap(row=>row.featured_media_id?[row.featured_media_id]:[]))];
  const media=ids.length?await client.from('content_media').select('id,storage_path,width,height').in('id',ids).abortSignal(signal):{data:[],error:null};
  if(media.error)throw new Error('holiday_reading_unavailable');
  return articles.map(row=>{const photo=media.data?.find(item=>item.id===row.featured_media_id);return {id:row.id,title:row.title,slug:row.slug,excerpt:row.excerpt,content_type:row.content_type,image:photo?{src:imageUrl(base,photo.storage_path),alt:row.featured_alt,width:photo.width,height:photo.height}:null};});
}
