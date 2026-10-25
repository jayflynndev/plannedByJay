import type {MetadataRoute} from 'next';
import {publicOrigin} from '@/lib/presentation';
import {holidayTypes} from '@/content/holiday-types';
import {approvedPolicies} from '@/content/policies';
export default function sitemap():MetadataRoute.Sitemap{return ['','/why-jay','/holidays','/travel-advice','/holiday-offers','/plan-my-holiday',...holidayTypes.map(t=>'/holidays/'+t.slug),...approvedPolicies().map(p=>p.href)].map(path=>({url:publicOrigin()+path}));}
