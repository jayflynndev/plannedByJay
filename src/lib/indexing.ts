import {publicOrigin} from '@/lib/presentation';
// The old root noindex was unconditional. Keep launch protection until Jay opts in
// on the production domain; preview deployments and localhost never become indexable.
export function publicIndexingEnabled(){
  if(process.env.SITE_INDEXABLE!=='true')return false;
  if(process.env.VERCEL==='1'&&process.env.VERCEL_ENV!=='production')return false;
  return ['plannedbyjay.com','www.plannedbyjay.com'].includes(new URL(publicOrigin()).hostname);
}
export function publicRobots(){return publicIndexingEnabled()?{index:true,follow:true}:{index:false,follow:false};}
