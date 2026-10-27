import {pageAdmin,ArticleError} from '@/lib/articles/client';
import Link from 'next/link';
import {requireEnquiryAdmin} from '@/lib/offers/enquiries';
import type {StoredBespokeEnquiry} from '@/lib/enquiries/server';
export default async function BespokeEnquiries({searchParams}:{searchParams:Promise<{view?:string;page?:string}>}){
  const client=await pageAdmin();await requireEnquiryAdmin(client);
  const params=await searchParams,pending=params.view==='pending',page=Math.max(1,Math.min(1000,Math.trunc(Number(params.page)||1)));
  let query=client.from('bespoke_enquiries').select('*',{count:'exact'}).order('created_at',{ascending:false}).order('id').range((page-1)*25,page*25-1);
  if(pending)query=query.is('notification_id',null);
  const result=await query;
  if(result.error)throw new ArticleError('Bespoke enquiries could not be loaded. Check that the bespoke enquiry migration has been applied. No records were changed.',503);
  const rows=(result.data||[]) as StoredBespokeEnquiry[];
  return <><h1>Bespoke Enquiries</h1><p>Original holiday briefs are retained privately. A Resend receipt confirms acceptance by the email service, not arrival in the mailbox.</p><nav aria-label="Bespoke enquiry views"><Link href="/admin/bespoke-enquiries">All enquiries</Link><Link href="/admin/bespoke-enquiries?view=pending">Pending notifications</Link></nav>
    <ul className="article-admin-list">{rows.map(enquiry=><li key={enquiry.id}><h2>{enquiry.reference}</h2><p><strong>{enquiry.name}</strong></p><p>Received {new Intl.DateTimeFormat('en-GB',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/London'}).format(new Date(enquiry.created_at))} (Europe/London)</p><p>{enquiry.brief.summary?.slice(0,2).map(row=>row.value).join(' · ')||'Saved holiday brief'}</p><p>{enquiry.notification_id?'Notification accepted by Resend':'Notification pending or unconfirmed'}</p><a href={'/admin/bespoke-enquiries/'+enquiry.id}>View Details</a></li>)}</ul>
    {!rows.length&&<p>{pending?'No pending notifications.':'No bespoke enquiries have been stored.'}</p>}
    <nav aria-label="Bespoke enquiry pages">{page>1&&<a href={'?'+new URLSearchParams({view:pending?'pending':'all',page:String(page-1)})}>Previous page</a>}{page*25<(result.count||0)&&<a href={'?'+new URLSearchParams({view:pending?'pending':'all',page:String(page+1)})}>Next page</a>}</nav>
  </>;
}
