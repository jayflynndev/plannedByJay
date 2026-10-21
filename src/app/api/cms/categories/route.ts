import { z } from 'zod';
import { databaseError } from '@/lib/cms/data';
import { failure, readJson, writeClient } from '@/lib/cms/http';
const input = z.object({id: z.uuid().optional(), name: z.string().trim().min(1).max(80)}).strict();
export async function POST(request: Request) {
  try {
    const client = await writeClient(request); const value = input.safeParse(await readJson(request,1000));
    if (!value.success) return Response.json({error:'Enter a category name of up to 80 characters.'},{status:400});
    const result = value.data.id ? await client.from('content_categories').update({name:value.data.name}).eq('id',value.data.id).select().single()
      : await client.from('content_categories').insert({name:value.data.name}).select().single();
    databaseError(result.error); return Response.json({category:result.data});
  } catch(error) { return failure(error); }
}
