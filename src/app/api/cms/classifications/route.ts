import { z } from 'zod';
import { databaseError } from '@/lib/cms/data';
import { failure, readJson, writeClient } from '@/lib/cms/http';
const input=z.object({kind:z.enum(['category','content-type']),name:z.string().trim().min(1).max(80)}).strict();
export async function POST(request:Request) {
  try {
    const client=await writeClient(request);
    const parsed=input.safeParse(await readJson(request,1000));
    if(!parsed.success)return Response.json({error:'Enter a name of 1 to 80 characters.'},{status:400});
    const result=await client.rpc('cms_create_classification',{p_kind:parsed.data.kind,p_name:parsed.data.name});
    databaseError(result.error);
    return Response.json({classification:result.data},{headers:{'Cache-Control':'private, no-store'}});
  } catch(error){return failure(error);}
}
