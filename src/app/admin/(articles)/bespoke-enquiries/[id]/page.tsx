import {z} from 'zod';
import {notFound} from 'next/navigation';
import {pageAdmin,ArticleError} from '@/lib/articles/client';
import {requireEnquiryAdmin} from '@/lib/offers/enquiries';
import type {StoredBespokeEnquiry} from '@/lib/enquiries/server';
import {BespokeEnquiryDetails} from '@/components/enquiry/BespokeEnquiryDetails';
export default async function BespokeEnquiry({params}:{params:Promise<{id:string}>}){
  const client=await pageAdmin();await requireEnquiryAdmin(client);
  const {id}=await params;if(!z.uuid().safeParse(id).success)notFound();
  const result=await client.from('bespoke_enquiries').select('*').eq('id',id).maybeSingle();
  if(result.error)throw new ArticleError('The holiday brief could not be loaded. It has not been changed.',503);
  if(!result.data)notFound();
  return <BespokeEnquiryDetails enquiry={result.data as StoredBespokeEnquiry}/>;
}
