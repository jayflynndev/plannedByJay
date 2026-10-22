import { z } from 'zod';
const querySchema=z.object({
  q:z.string().trim().max(120).default(''),
  type:z.string().trim().max(80).default(''),
  category:z.union([z.literal(''),z.uuid()]).default(''),
  tag:z.union([z.literal(''),z.uuid()]).default(''),
  page:z.coerce.number().int().min(1).max(1000).default(1),
});
export type DiscoveryQuery=z.output<typeof querySchema>;
export type SearchParameters=Record<string,string|string[]|undefined>;
export function parseDiscoveryQuery(params:SearchParameters) {
  const parsed=querySchema.safeParse(Object.fromEntries(['q','type','category','tag','page'].map(key=>[key,params[key]])));
  return {valid:parsed.success,query:parsed.success?parsed.data:querySchema.parse({})};
}
export function discoveryHref(query:DiscoveryQuery,page=query.page) {
  const params=new URLSearchParams();
  for(const key of ['q','type','category','tag'] as const)if(query[key])params.set(key,query[key]);
  if(page>1)params.set('page',String(page));
  return `/travel-advice${params.size?`?${params}`:''}`;
}
