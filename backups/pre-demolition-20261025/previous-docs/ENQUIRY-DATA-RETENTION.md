# Enquiry data retention procedure

Adopted by Jay’s instruction, 22 October 2026. **Owner: Jay. Frequency: monthly**, with a restricted review log and next review date. No customer deletion was performed. The record-specific erasure support below is implemented and fixture-tested; its separate migration has not been applied to the hosted project.

## Monthly review

1. In an approved restricted workspace, identify enquiries by friendly reference and internal UUID. Do not export briefs into this repository or a public spreadsheet. Record status, last meaningful customer contact date, evidence location, review decision and next action; avoid duplicating holiday details.
2. Establish last meaningful contact from actual correspondence or a recorded customer conversation about the enquiry. The submission is the starting contact if no later contact exists. Automated retries, provider acceptance, logins, administrative edits and marketing do not restart the clock. Do not infer last contact from `received_at` alone. If evidence is incomplete, investigate and record the uncertainty rather than deleting blindly. No last-contact column or contact-history system exists here.
3. Classify **active** (ongoing plans/customer discussion), **inactive unsuccessful** (no booking and no continuing work), or **booking** (a genuine booking progressed through New Travel). Review inactive unsuccessful cases at 12 calendar months after last meaningful contact and normally delete them. Active work needs a reason and next review date; do not retain forever by labelling everything active. Booking-system records follow actual New Travel/supplier requirements; remove unnecessary website duplicates when appropriate.
4. For a dispute, outstanding rights request or identified legal duty, record the specific reason, limited records required, responsible person and expiry/review date. Do not apply a blanket indefinite hold or invent a statutory period. Ask New Travel’s responsible privacy contact where allocation is needed.

## Safe erasure: manual installation

`supabase/migrations/20261022_safe_enquiry_erasure.sql` adds a protected outstanding-attempt table, a lease-change tracking trigger, compatible notification completion and `erase_holiday_enquiry`. No public/admin HTTP deletion endpoint is added. The existing receive/claim APIs, snapshots, retry limits, backoff and provider idempotency keys stay intact.

Before applying: the authorised database owner checks backup/restore arrangements, confirms the 20261012 and 20261013 enquiry migrations already exist, reviews the complete new file, and runs **only that file once** in Supabase SQL Editor. Do not rerun initial migrations, reset tables or run it automatically. Applying it adds metadata/functions and revokes direct service-role DELETE; it does not erase or rewrite enquiries. Existing enquiry rows receive a separate `legacy_review` blocker because earlier workers were untracked. Approve installation separately from each deletion. No application deployment is needed for these database functions/triggers; the sitemap/code changes need their own release.

## Review and erase one record

1. Jay confirms eligibility from contact history, business status and holds above. Obtain explicit record-level authorisation; the database does not infer eligibility from creation date. Use the restricted SQL Editor as an authorised database administrator. Never place a service key in a browser/client or create a public deletion endpoint.
2. Inspect only the intended UUID/reference, status, attempts, provider ID and blockers (no brief or snapshot export):

```sql
select id, reference, notification_status, notification_attempts,
       notification_provider_id, lease_token is not null as has_lease
from public.holiday_enquiries
where id = 'REPLACE_WITH_EXACT_UUID'::uuid
  and reference = 'REPLACE_WITH_EXACT_REFERENCE';
select attempt_token, kind
from public.holiday_notification_erasure_blockers
where enquiry_id = 'REPLACE_WITH_EXACT_UUID'::uuid;
```

3. If blockers exist, **do not erase or simply expire a lease**. A retry can hold a snapshot after losing its lease. For new attempts, the tracking row is removed only when that exact worker completes its send and calls finish, even if its lease is stale. A crash or failed completion leaves the blocker and therefore refuses erasure. A newer accepted attempt cannot clear an older worker's blocker.
4. Legacy markers and orphaned attempts require a separately approved technical reconciliation: stop all submission/notification entry paths, verify the hosting platform has terminated/drained all relevant in-flight executions (not just the 90-second lease), reconcile provider acceptance/uncertainty, and record the evidence. Do not change snapshots or blindly reset queues. If termination/outcome cannot be established, leave the blocker and investigate. After termination is established, an authorised database owner may remove **only the exact reconciled blocker** below. This is a deliberate maintenance action, not ordinary monthly cleanup. Provider acceptance can be recorded through the existing specific reconciliation instructions in ENQUIRY-SETUP.md; failed/manual-review outcomes remain refused until safely resolved. Never label acceptance as inbox delivery.

```sql
-- ONLY after documented execution-termination and outcome reconciliation.
-- For legacy_review the token is 00000000-0000-0000-0000-000000000000.
delete from public.holiday_notification_erasure_blockers
where enquiry_id = 'REPLACE_WITH_EXACT_UUID'::uuid
  and attempt_token = 'REPLACE_WITH_EXACT_RECONCILED_TOKEN'::uuid
  and kind = 'REPLACE_WITH_attempt_OR_legacy_review';
```

5. With no blockers, only an unattempted pending notification or a completed provider-accepted notification is eligible technically. Sending (even expired), failed, manual-review, leftover leases and uncertain outcomes are refused. An unattempted pending record is atomically cancelled by erasure; no message is sent. The RPC locks the enquiry row, checks UUID/reference and explicit authorisation, checks all blockers, then deletes that one row in the same transaction. A concurrent claim either wins and blocks erasure, or loses because the row has gone.

```sql
-- Explicit destructive action: run only for Jay's individually authorised eligible record.
select public.erase_holiday_enquiry(
  'REPLACE_WITH_EXACT_UUID'::uuid,
  'REPLACE_WITH_EXACT_REFERENCE',
  true
);
```

6. Require result `erased`, then verify that exact row is absent and its reference reservation still exists. `not_found` does not prove who deleted a record; investigate before recording success. `authorisation_required`, `reference_mismatch` and `notification_unresolved` mean no deletion. Do not bypass refusal with raw DELETE or clear another record's state. Confirm separately what happened to mailbox/provider copies below. Whole enquiry-row erasure includes its snapshot; snapshots of retained enquiries stay immutable.

**Never delete or alter `holiday_enquiry_reference_reservations`.** Its permanent reference/time reservations have no enquiry foreign key and prevent recycling after erasure. Keep existing UUID/reference relationships intact until authorised erasure. Hashed security/rate-limit data is separate; opportunistic two-day limit-bucket cleanup is not a customer-erasure procedure or proof that backups/logs have expired.

## Other copies and backups

- Jay reviews related business inbox, sent, archives, deleted/recoverable items, attachments, exports and any forwarded/shared copies. Account administrator checks holds and actual mailbox retention. Do not retain a duplicate simply because the database copy was removed.
- Locate Resend copies using provider ID where available. Jay confirms Free; the established provider research records a normal 30-day email/log retention for Free, independently of the longer Supabase/mailbox copies. Confirm supported erasure/support handling and any relevant exceptions; sending region is not storage location. Acceptance is not evidence of inbox delivery or erasure. Record expiry or support outcome without claiming deletion that was not confirmed.
- Account administrators record Supabase backup/PITR, mailbox and provider retention periods and access restrictions. Individual immediate erasure from immutable backups must not be promised. Maintain a minimal restricted erasure ledger so restored data is isolated and deletions/holds reapplied before operational use. Do not destroy whole backups for one enquiry.
- Retain only the minimal evidence of actions/holds needed for accountability, with a separately approved review period; do not reproduce the deleted brief in that log. Provider retention, backup expiry and that log period still require account/privacy approval.

## Privacy requests

Jay receives requests at jay@plannedbyjay.com, logs receipt and the applicable response deadline, verifies identity proportionately, locates all relevant stores and coordinates with New Travel under the confirmed GDPR agreement. Do not request passports by ordinary email as a default identity check. Respond without undue delay, normally within one month; obtain responsible privacy advice on any lawful extension, exception or identity/clarification timing, and explain it to the requester. Do not wait for the monthly review.

Record request type, minimal identity-check outcome, search locations, responsible parties, action dates, secure response method, any justified refusal/hold and next review. Redact unrelated travellers’ information from disclosures. Correction/restriction requests must account for snapshots and pending sends without rewriting immutable notifications. Booking-system requests go to the appropriate New Travel/supplier handler; Jay remains the website contact and tracks the handoff. Confirm erasure only for stores actually addressed and explain remaining justified retention/backups.

## Approval record still needed

Jay owns the monthly review. The responsible privacy reviewer approves exceptions, request handling and log retention; technical/account administrators approve the migration, any legacy/orphan reconciliation and provider/backup handling. Use a short restricted action note in an existing approved business record: reference, contact-evidence location, decision/hold, reviewer/date, RPC outcome, stores addressed and next review. Do not create a second customer database or copy briefs/tokens into the log. Installation and each destructive action require separate explicit authorisation. No automatic deletion scheduler is implemented.
