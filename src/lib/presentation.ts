import type {DiscoveryQuery} from '@/types/public-content';
export function publicOrigin(){try{return new URL(process.env.SITE_URL||'https://plannedbyjay.com').origin;}catch{return 'https://plannedbyjay.com';}}
export function discoveryHref(query:DiscoveryQuery,page=query.page){const p=new URLSearchParams();for(const k of ['q','type','category','tag'] as const)if(query[k])p.set(k,query[k]);if(page>1)p.set('page',String(page));return '/travel-advice'+(p.size?'?'+p:'');}
export function optionLabel(options:readonly {value:string;label:string}[],value:string){return options.find(o=>o.value===value)?.label??value;}
export function safeImageUrl(value:string){return /^\/images\/[a-zA-Z0-9/_.-]+$/.test(value)&&!value.includes('..');}
