import {z} from 'zod';
import {revalidatePath} from 'next/cache';
import {writeClient,readJson,ArticleError,failure} from '@/lib/articles/client';
import {requireEnquiryAdmin} from '@/lib/offers/enquiries';
import {loadBespokeEnquiry,notifyBespokeEnquiry,bespokeServiceClient} from '@/lib/enquiries/server';
export async function POST(request:Request){
  try{
    const admin=await writeClient(request);await requireEnquiryAdmin(admin);
    const input=z.object({id:z.uuid(),confirmedUnsent:z.boolean().default(false)}).strict().safeParse(await readJson(request));
    if(!input.success)throw new ArticleError('Choose a saved holiday brief.');
    const client=bespokeServiceClient(),enquiry=await loadBespokeEnquiry(client,input.data.id);
    await notifyBespokeEnquiry(client,enquiry,input.data.confirmedUnsent);
    revalidatePath('/admin/bespoke-enquiries');revalidatePath('/admin/bespoke-enquiries/'+enquiry.id);
    return Response.json({notification:'accepted'},{headers:{'Cache-Control':'private, no-store'}});
  }catch(error){return failure(error);}
}
