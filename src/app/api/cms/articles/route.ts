import { articleInput } from '@/lib/cms/schema';
import { failure, readJson, writeClient } from '@/lib/cms/http';
import { saveArticle } from '@/lib/cms/publishing';
import { revalidatePath } from 'next/cache';
export async function POST(request: Request) {
  try {
    const client = await writeClient(request);
    const input=await readJson(request);
    const parsed = articleInput.safeParse(input);
    if (!parsed.success) return Response.json({error: 'Please check the highlighted fields.', fields: parsed.error.flatten().fieldErrors}, {status:400});
    const saved = await saveArticle(client,input,revalidatePath);
    return Response.json({article: saved}, {headers: {'Cache-Control':'private, no-store'}});
  } catch(error) { return failure(error); }
}
