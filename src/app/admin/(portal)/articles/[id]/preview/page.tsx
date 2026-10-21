import { notFound } from 'next/navigation';
import { z } from 'zod';
import { pageAdmin } from '@/lib/cms/client';
import { categories, getArticle, publicMedia } from '@/lib/cms/data';
import { cmsConfig } from '@/lib/cms/config';
import { ArticleView } from '@/components/cms/ArticleView';
export default async function Preview({params}:{params:Promise<{id:string}>}) {
  const client=await pageAdmin();const {id}=await params;if(!z.uuid().safeParse(id).success)notFound();const article=await getArticle(client,id);if(!article)notFound();
  const [media,cats]=await Promise.all([publicMedia(client,article.featured_media_id),categories(client)]);
  return <><div className="cms-notice">Private saved preview · {article.status}. <a href={`/admin/articles/${id}/edit`}>Return to editor</a></div><ArticleView article={article} media={media} mediaBase={cmsConfig()!.url} category={cats.find(cat=>cat.id===article.category_id)?.name}/></>;
}
