import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { articleStatuses } from '@/content/cms';
import { failure, readJson, writeClient } from '@/lib/cms/http';
import { databaseError, getArticle } from '@/lib/cms/data';
import { CmsError } from '@/lib/cms/security';
import { editorValue } from '@/lib/cms/editor';
import { saveArticle } from '@/lib/cms/publishing';
export async function POST(request:Request) {
  try {
    const client=await writeClient(request);const parsed=z.object({id:z.uuid(),status:z.enum(articleStatuses)}).strict().safeParse(await readJson(request,1000));
    if(!parsed.success)throw new CmsError('Choose a valid article and publication status.');
    const article=await getArticle(client,parsed.data.id);if(!article)throw new CmsError('This article is no longer available.',404);
    const editorial=await client.from('content_editorial').select('sources,notes').eq('article_id',article.id).maybeSingle();databaseError(editorial.error);
    const saved=await saveArticle(client,{...editorValue(article,editorial.data),status:parsed.data.status},revalidatePath);
    return Response.json({article:saved});
  } catch(error) {return failure(error);}
}
