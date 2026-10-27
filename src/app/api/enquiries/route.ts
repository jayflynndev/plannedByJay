import {ArticleError,checkOrigin,failure,readJson} from '@/lib/articles/client';
import {bespokeEnquiryAvailability,completeBespokeEnquiry} from '@/lib/enquiries/server';
import {bespokeInput,BESPOKE_REFERENCE_FORMAT} from '@/lib/enquiries/schema';
export async function POST(request:Request){
  try{
    checkOrigin(request);
    if(!bespokeEnquiryAvailability().enabled)throw new ArticleError('Holiday enquiries are temporarily unavailable. Please contact Jay by email.',503);
    // Old deployed form tabs reject numeric receipts. Stop before saving their data.
    if(request.headers.get('X-Bespoke-Reference-Format')!==BESPOKE_REFERENCE_FORMAT)throw new ArticleError('The enquiry form has been updated. Copy your answers, then refresh this page before sending.',409);
    const input=await readJson(request),parsed=bespokeInput.safeParse(input);
    if(!parsed.success)return Response.json({error:'Check your holiday brief.',errors:Object.fromEntries(parsed.error.issues.map(issue=>[issue.path.slice(1).join('.'),issue.message]))},{status:400,headers:{'Cache-Control':'private, no-store'}});
    const receipt=await completeBespokeEnquiry(request,input);
    return Response.json(receipt,{status:receipt.notification==='pending'?202:200,headers:{'Cache-Control':'private, no-store'}});
  }catch(error){return failure(error);}
}
