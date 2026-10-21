import { notFound } from 'next/navigation';
import { z } from 'zod';
import { pageAdmin } from '@/lib/cms/client';
import { categories, databaseError, getArticle, mediaList, publicMedia } from '@/lib/cms/data';
import { cmsConfig, publicOrigin } from '@/lib/cms/config';
import { editorValue } from '@/lib/cms/editor';
import { ArticleEditor } from '@/components/cms/ArticleEditor';
export default async function EditArticle({params}:{params:Promise<{id:string}>}) {
  const client=await pageAdmin();const {id}=await params;if(!z.uuid().safeParse(id).success)notFound();
  const article=await getArticle(client,id);if(!article)notFound();
  const [cats,media,editorial,featured]=await Promise.all([categories(client),mediaList(client),client.from('content_editorial').select('sources,notes').eq('article_id',id).maybeSingle(),publicMedia(client,article.featured_media_id)]);databaseError(editorial.error);
  if(featured&&!media.some(item=>item.id===featured.id))media.push(featured);
  return <ArticleEditor initial={editorValue(article,editorial.data)} categories={cats} initialMedia={media} mediaBase={cmsConfig()!.url} siteOrigin={publicOrigin()}/>;
}
