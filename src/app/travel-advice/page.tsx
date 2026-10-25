import {ArticleDiscovery} from '@/components/articles/ArticleDiscovery';
import {cmsCopy} from '@/content/articles';
import {publicOrigin} from '@/lib/presentation';
export function generateMetadata(){return {title:cmsCopy.title+' | Planned by Jay',description:cmsCopy.description,alternates:{canonical:publicOrigin()+'/travel-advice'}};}
export default function TravelAdvice(){return <ArticleDiscovery query={{q:'',type:'',category:'',tag:'',page:1}} results={{total:0,articles:[],categories:[],tags:[]}}/>;}
