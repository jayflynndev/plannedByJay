# Offer enquiries: verified operation and recovery

Jay has confirmed a successful public Holiday Offer enquiry: the record was saved in Supabase, the notification arrived in `jay@plannedbyjay.com`, and the customer saw the correct acknowledgement. The Privacy Policy is public at `/privacy`; the existing `deliveryVerified` flag is true. Keep the current Supabase/Resend configuration and this working journey intact.

No further offer activation action is needed for bespoke setup. Do not disable offer delivery or repeat the old initial SQL test while testing bespoke enquiries. The bespoke form uses the same transport, administrator checks and retry pattern, with its own private records and single activation setting. See [BESPOKE-ENQUIRIES.md](BESPOKE-ENQUIRIES.md) for that migration, activation and one controlled live test.

## Pending notification recovery

Open **Admin → Offer enquiries**. The default view is pending/unconfirmed notifications; All enquiries includes stored Resend receipts. Only the existing verified administrator can access this page or its retry endpoint. No customer data is exposed through public reads.

If storage succeeds but sending/receipt recording fails, the public response is HTTP 202 with a clear saved-but-notification-pending acknowledgement. The customer is not told that an email was delivered. The record remains visible to Jay and is not recreated when retried. A stored Resend receipt prevents subsequent sends. Errors before storage do not acknowledge acceptance; a confirmation-read failure explicitly says the record was saved and can be retried safely.

Resend [retains idempotency keys for 24 hours](https://resend.com/docs/dashboard/emails/idempotency-keys). Within the safe retry window, the saved enquiry ID and unchanged snapshot/submission time produce the same key and payload. After 23 hours the retry screen requires Jay to check the mailbox and Resend before deliberately resending, leaving a margin before key expiry. This is duplicate-send protection for recovery, not a new launch gate.

If an older message was already accepted but its database receipt is missing, **do not resend it**. Match its internal enquiry ID in the Resend message body, then record the actual existing receipt as database owner:

```sql
-- Substitute the verified existing receipt and the saved enquiry's internal ID.
update public.offer_enquiries
set notification_id='<verified Resend email ID>', notified_at=now()
where id='<saved enquiry UUID>'::uuid and notification_id is null;
```

This records when the receipt was reconciled. If Resend accepted a message but it did not arrive, inspect the existing Resend delivery events and mailbox before treating delivery as verified. The administration screen deliberately says accepted, not delivered. There is no scheduler, CRM, public resend function or automatic customer email.
