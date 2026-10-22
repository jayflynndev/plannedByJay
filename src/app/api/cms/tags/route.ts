import { z } from 'zod';
import { failure, readJson, writeClient } from '@/lib/cms/http';
import { CmsError, databaseError } from '@/lib/cms/security';
const input=z.object({name:z.string().transform(name=>name.replace(/\s+/g,' ').trim()).pipe(z.string().min(1).max(40))}).strict();
export async function POST(request:Request) {
  try {
    const client=await writeClient(request);
    const parsed=input.safeParse(await readJson(request,1000));
    if(!parsed.success)throw new CmsError('Enter a tag name of 1 to 40 characters.');
    const result=await client.rpc('cms_create_tag',{p_name:parsed.data.name});
    if(result.error?.code==='22023')throw new CmsError('Use an existing tag: the tag limit has been reached.');
    databaseError(result.error);
    return Response.json({tag:result.data},{headers:{'Cache-Control':'private, no-store'}});
  } catch(error) {return failure(error);}
}
