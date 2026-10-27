import type {MetadataRoute} from 'next';
import {publicOrigin} from '@/lib/presentation';
export default function robots():MetadataRoute.Robots{
  // Allow crawling public pages so their metadata can communicate the launch gate.
  return {rules:{userAgent:'*',allow:'/',disallow:['/admin','/api/']},sitemap:publicOrigin()+'/sitemap.xml'};
}
