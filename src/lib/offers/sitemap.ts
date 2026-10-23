import 'server-only';
import {publicClient} from '@/lib/cms/client';
import {offersEnabled} from './public';
import {z} from 'zod';
export async function offerSitemap(origin:string){if(!await offersEnabled())return [];try{const result=await publicClient()!.from('holiday_offers').select('slug,updated_at').eq('status','published').gt('expires_at',new Date().toISOString()).order('slug').limit(1000).abortSignal(AbortSignal.timeout(5000));if(result.error)throw new Error('offers_sitemap_unavailable');const rows=z.array(z.object({slug:z.string().max(140).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),updated_at:z.string()})).parse(result.data);return [{url:`${origin}/holiday-offers`},...rows.map(row=>({url:`${origin}/holiday-offers/${row.slug}`,lastModified:row.updated_at}))];}catch{console.warn('offers_sitemap_unavailable');return [];}}
