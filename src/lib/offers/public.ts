import 'server-only';
import {publicClient} from '@/lib/cms/client';
import {offersQuery,type OffersQuery} from './query';
import {loadOffers} from './data';
export async function safeOffers(query:OffersQuery=offersQuery.parse({}),options:Parameters<typeof loadOffers>[1]={}){try{return {...await loadOffers(query,options,publicClient()),unavailable:false};}catch{console.warn('holiday_offers_unavailable');return {offers:[],total:0,unavailable:true};}}
export async function offersEnabled(){const client=publicClient();if(!client)return false;try{const result=await client.rpc('holiday_offers_enabled').abortSignal(AbortSignal.timeout(5000));return !result.error&&result.data===true;}catch{return false;}}
