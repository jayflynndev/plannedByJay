import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { cmsConfig } from '@/lib/cms/config';
import { databaseError } from '@/lib/cms/data';
import { failure, readJson, writeClient } from '@/lib/cms/http';
import { CmsError } from '@/lib/cms/security';
import { MAX_IMAGE_BYTES, prepareImage, safeFilename } from '@/lib/cms/media';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  try {
    const client = await writeClient(request); const config = cmsConfig()!;
    // Bound the complete multipart request before parsing it, including chunked uploads.
    const reader=request.body?.getReader(); if(!reader) throw new CmsError('Choose a photograph.');
    let size=0; const chunks:Uint8Array[]=[];
    while(true) {const part=await reader.read(); if(part.done)break; size+=part.value.length;
      if(size>MAX_IMAGE_BYTES+65536) {await reader.cancel(); throw new CmsError('Choose an image smaller than 5 MB.',413);} chunks.push(part.value);}
    const form = await new Response(Buffer.concat(chunks), {headers:{'Content-Type':request.headers.get('content-type') || ''}}).formData();
    const file = form.get('file'); if (!(file instanceof File)) throw new CmsError('Choose a photograph.');
    const image = await prepareImage(Buffer.from(await file.arrayBuffer()),file.type);
    const existing = await client.from('content_media').select('*').eq('sha256',image.sha256).maybeSingle(); databaseError(existing.error);
    if (existing.data) return Response.json({media:existing.data, duplicate:true});
    const id=randomUUID(); const path=`${id}.webp`;
    const uploaded = await client.storage.from(config.bucket).upload(path,image.data,{contentType:'image/webp',upsert:false});
    if(uploaded.error) throw new CmsError('The photograph could not be uploaded. Check Storage configuration and try again.',503);
    const saved=await client.rpc('cms_register_media',{p_media:{id,storage_path:path,original_name:safeFilename(file.name),sha256:image.sha256,width:image.width,height:image.height,bytes:image.data.length}});
    if(saved.error || saved.data.id !== id) await client.storage.from(config.bucket).remove([path]);
    databaseError(saved.error); return Response.json({media:saved.data,duplicate:saved.data.id !== id});
  } catch(error) {return failure(error);}
}
export async function DELETE(request: Request) {
  try {
    const client=await writeClient(request); const value=z.object({id:z.uuid()}).strict().safeParse(await readJson(request,1000));
    if(!value.success) throw new CmsError('Choose an image to remove.');
    const found=await client.from('content_media').select('*').eq('id',value.data.id).maybeSingle(); databaseError(found.error);
    if(!found.data) throw new CmsError('The image is no longer in the library.',404);
    // Registry foreign keys make this safe against simultaneous article saves.
    const deleted=await client.rpc('cms_delete_media',{p_id:value.data.id}); databaseError(deleted.error);
    const removed=await client.storage.from(cmsConfig()!.bucket).remove([found.data.storage_path]);
    if(removed.error) throw new CmsError(`The unused image was removed from the library, but Storage cleanup failed. Ask the owner to remove ${found.data.storage_path} from the editorial-images bucket in Supabase Storage.`,503);
    return Response.json({removed:true});
  } catch(error) {return failure(error);}
}
