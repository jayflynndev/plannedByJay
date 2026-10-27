# Bespoke holiday enquiries

The existing three-stage `/plan-my-holiday` form is connected to private storage and the working Supabase/Resend enquiry services. Its questions, review stage and styling are retained. There is no automatic connection to New Travel booking systems or suppliers.

## Activate once

1. In Supabase SQL Editor, run **`supabase/migrations/20261027_bespoke_enquiries.sql`** after the existing Articles/offer-enquiry setup. This single, re-runnable migration adds `bespoke_enquiries`, its indexes, Jay-only read policy and a service-only receive function. It does not alter existing data or tables.
2. Set **`BESPOKE_ENQUIRIES_ENABLED=true`** in the existing Vercel environment for the intended deployment, then deploy normally. Reuse the current Supabase and Resend settings. There are no new credentials, mail providers or delivery-approval flags. Until this setting is present, both the public form and endpoint remain closed. Set it to false and redeploy to close the bespoke route independently of offers.
3. Submit one controlled brief at `/plan-my-holiday` with Jay's own contact details. Check its reference and acknowledgement, **Admin > Bespoke Enquiries > View Details**, and the actual inbox/junk folder. Check every answer, children's ages, total party budget and Reply-To. An accepted Resend receipt is not itself proof of mailbox arrival.

The hosted migration, environment change, deployment and real bespoke mailbox test are Jay's actions; none was performed by the assistant. The existing public Holiday Offer journey stays operational throughout.

## Daily use and recovery

**Admin > Bespoke Enquiries** lists original submissions, their references and notification status. Open **View Details** to read the whole brief. Pending means sending failed or the delivery receipt is unconfirmed. Retry the saved notification there; do not create another enquiry. For a pending record older than 23 hours, check Resend and the mailbox before confirming a resend. This reuses the offer enquiry recovery rule because Resend idempotency keys last 24 hours.

If an older notification was already accepted, record its verified existing receipt as database owner instead of sending it again:

```sql
update public.bespoke_enquiries
set notification_id='<verified existing Resend email ID>',
    notified_at=now(), last_notification_error=null
where id='<saved internal enquiry UUID>'::uuid and notification_id is null;
```

References use random `PBJ-` identifiers and are separate from the unchanged six-digit Holiday Offer references. A retry uses the same request UUID; an identical brief from the same coded client within ten minutes also reuses the saved record after a reload. New distinct submissions are limited to three per ten minutes per coded client. Raw network addresses are not stored in enquiry rows. No enquiry answers are saved in browser storage.

The database keeps the original answers and a server-created snapshot of question labels and option descriptions. Later website edits do not rewrite old briefs or retry emails. The mail service can update receipt/error fields, not the saved answers or reference. A successful save with pending mail is acknowledged honestly; a failed save is not acknowledged as received.

Both routes use `/privacy`, the fixed `jay@plannedbyjay.com` recipient and existing administrator permissions. The accessibility option requests a private discussion; no new medical, passport, payment or marketing fields were added. Keep following the existing monthly retention review, normally deleting inactive unsuccessful enquiries 12 calendar months after last meaningful customer contact, including appropriate mailbox/provider copies. The admin inbox does not add a deletion workflow.

## Editing and checks

Edit existing questions/options in `src/content/enquiry.ts`. Keep stable option values; conditional validation and limits are in `src/lib/enquiries/schema.ts`. Submission handling uses `src/lib/enquiries/server.ts`; email delivery uses the shared existing Resend transport. No changes to the offer activation flag are required for bespoke setup.

All **60 automated tests**, ESLint, TypeScript and the production build passed. Tests cover the three stages and editing, conditional validation, private storage/RLS, random references, duplicate/rate handling, email content/Reply-To, pending acknowledgement and retry recovery. Test fixtures run in isolated local PostgreSQL-compatible databases and mock mail delivery; they do not send live mail. Desktop (1440px) and mobile (390px) browser checks passed through every stage and a simulated pending acknowledgement, with no horizontal overflow or browser exceptions. Browser submissions were intercepted locally and never reached Supabase or Resend. Normal configuration still reports bespoke off and offers on.

Use the project's Node 22.13+ runtime for normal checks. Validation here used the available Node 20 with a temporary test-only WebSocket shim; no dependency or runtime requirement was changed.
