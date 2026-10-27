import type {StoredBespokeEnquiry} from '@/lib/enquiries/server';
import Link from 'next/link';
import {briefSnapshotSchema} from '@/lib/enquiries/schema';
import {notificationNeedsReview} from '@/lib/offers/enquiries';
import {RetryOfferNotification} from '@/components/offers/RetryOfferNotification';
export function BespokeEnquiryDetails({enquiry}:{enquiry:StoredBespokeEnquiry}){
  const snapshot=briefSnapshotSchema.safeParse(enquiry.brief);
  return <><h1>Bespoke enquiry {enquiry.reference}</h1><p>Received {new Intl.DateTimeFormat('en-GB',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/London'}).format(new Date(enquiry.created_at))} (Europe/London)</p>
    {enquiry.issued_reference&&<p>Original customer reference (still valid): {enquiry.issued_reference}</p>}
    <dl>{snapshot.success?snapshot.data.summary.map((row,i)=><div key={i}><dt><strong>{row.label}</strong></dt><dd className="offer-enquiry-message">{row.value}</dd></div>):<div><dt>Original submitted brief</dt><dd className="offer-enquiry-message">{JSON.stringify(enquiry.brief,null,2)}</dd></div>}</dl>
    <p>Internal enquiry ID: {enquiry.id}</p>
    {enquiry.notification_id?<p>Notification accepted by Resend. Check the mailbox for arrival. Receipt: {enquiry.notification_id}</p>:<><p><strong>Notification pending or unconfirmed</strong></p>{enquiry.last_notification_error&&<p>Last delivery result: {enquiry.last_notification_error}</p>}<RetryOfferNotification id={enquiry.id} needsReview={notificationNeedsReview(enquiry.created_at)} endpoint="/api/enquiries/notification"/></>}
    <p><Link href="/admin/bespoke-enquiries">Back to Bespoke Enquiries</Link></p>
  </>;
}
