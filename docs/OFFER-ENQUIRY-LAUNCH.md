# Offer enquiries: verification and launch

The implementation reuses the existing form, `receive_offer_enquiry` RPC, private `offer_enquiries` table and Resend configuration. No migration, new service or environment variable is required. Public submissions remain disabled. The bespoke Holiday Brief remains disabled separately.

## Current evidence

- The complete Privacy Policy in `src/content/policies.ts` is ready for Jay's final review; `/privacy` remains unavailable until approved. [PRIVACY-REVIEW.md](PRIVACY-REVIEW.md) records the established New Travel operational arrangement, published provider transfer terms and the specific Vercel Hobby commercial-use issue. No further New Travel responsibility questionnaire is needed.
- Existing Supabase/Resend private settings are populated. A certificate-verified, server-identified, zero-row enquiry-schema request succeeded (HTTP 200); no live enquiry was created.
- The local Node 20 TLS request to Resend fails with `UNABLE_TO_VERIFY_LEAF_SIGNATURE`. A strict Windows TLS connection succeeds and reports the issuer as **Norton Web/Mail Shield Root**, generated for Norton SSL/TLS scanning. This establishes a local certificate trust difference; it does not establish a Resend delivery failure. No certificate checks or security settings were changed.
- Resend recognises the configured key as a restricted send-only key. Its `restricted_api_key` response to a domain-list request is a permission limitation, not an invalid-key diagnosis. Domain verification must be checked in the existing Resend dashboard; no broader API key is needed just for this check.
- No live message was sent, so Resend acceptance and actual mailbox arrival remain unverified. Production environment settings were not changed or independently inspected.

## Privacy action before publication

Jay reviews the complete policy using the established New Travel arrangement, then approves publication as described in [PRIVACY-REVIEW.md](PRIVACY-REVIEW.md). The policy explains published provider safeguards without claiming bespoke account agreements or completed transfer assessments. The last recorded Vercel plan is Hobby: use an eligible commercial plan with applicable processing terms before processing live customer enquiries. No account or plan has been changed. Retain the existing monthly manual review and normal 12-calendar-month retention after last meaningful customer contact for inactive unsuccessful enquiries, including related copies; deletion is not automatic.

The implementation collects name, email, optional telephone/message, an immutable holiday snapshot, submission time and a keyed client-address hash for spam control. Records remain in Supabase until deliberately removed under the owner's retention process. Notification content is sent through Resend to the fixed business mailbox; mailbox/provider retention must also be considered. There is no marketing opt-in or automated customer sales email. The [ICO privacy-information guidance](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/the-right-to-be-informed/what-privacy-information-should-we-provide/) explains the information to address.

Finalise **`policies.privacy.sections` in `src/content/policies.ts`**. Only after owner approval, set its existing `approved` to `true`, set `updatedAt` to the actual review/publication date, and resolve the `reviewRequired` entries. Verify `/privacy` returns the approved content and the enquiry form links to it. Preparing the draft has not approved or published it.

## Short owner-controlled production test

**Quick route:** publish the approved policy on eligible hosting, keep `deliveryVerified=false`, run the owner-only SQL below once, then open `/admin/offer-enquiries` and retry that row's notification. Confirm arrival in `jay@plannedbyjay.com`, the saved holiday details and Reply-To. Only then use the existing launch control below. No public submissions need to be enabled for this test.

Use the supported hosting runtime and existing configuration; local Norton inspection need not be bypassed. Keep `deliveryVerified=false` throughout this initial check.

1. Deploy the reviewed code yourself. In Vercel, confirm the existing `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `RESEND_API_KEY`, `ENQUIRY_EMAIL_FROM` and `ENQUIRY_EMAIL_TO` values are configured for that deployment. The recipient is `jay@plannedbyjay.com`. Check the configured sender domain is verified in the existing Resend dashboard. Never put private keys in browser code.
2. **As owner, run the following once using your own contact details** in Supabase SQL Editor. This calls the existing storage function, not a migration. It creates one clearly labelled owner enquiry for existing offer `000001`. Check that the offer is still eligible; otherwise substitute another real published reference. Repeating the same request UUID returns the same enquiry instead of creating another.

```sql
select public.receive_offer_enquiry(
 'bf3ba73e-565c-4db6-b54d-f18f812ea87c'::uuid,
 (select id from public.holiday_offers where reference='000001'),
 'Jay', 'jay@plannedbyjay.com', '',
 'OWNER-APPROVED WORKFLOW TEST: verify the saved holiday, notification and reply address.',
 repeat('d',64)
);
```

3. Sign in at **`/admin/offer-enquiries`**. Confirm the saved holiday snapshot/contact details and pending notification. Click **Retry email notification**. Check the Resend receipt, then the actual inbox/junk folder. Verify offer reference/title/supplier, travel dates, party total/counts, contact/message and submission time; Reply should target the submitted customer email. Resend acceptance alone is not proof of mailbox arrival.
4. If sending fails, the row stays pending. Fix the actual sender/delivery/configuration issue and retry the same row. Check that only one notification is accepted. Failure and missing-receipt recovery are also covered by isolated tests; do not change live credentials merely to manufacture an outage.

The assistant has not run the test SQL or sent a fictional customer enquiry. Jay running this deliberately authorises that single real owner-contact test.

## Existing launch control

After **both** mailbox delivery and the applicable published Privacy Policy have been checked, change the existing **`const deliveryVerified=false` to `true` in `src/lib/offers/enquiries.ts`**, then deploy through Jay's normal process. The existing availability check also requires working storage/mail configuration and `approvedPolicyHref('privacy')`. There is no new database toggle or launch environment flag.

Submit one owner-authorised enquiry through the actual four-field public form. Confirm the displayed holiday summary, stored snapshot, email and customer acknowledgement. Repeat clicks/retries should keep the same record; an accepted record disables further submission from that form. This final public HTTP/browser check remains outstanding until the existing launch requirements are satisfied.

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
