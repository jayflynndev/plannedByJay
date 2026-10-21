# Friendly enquiry references — manual migration

New enquiries use six **random**, non-sequential digits: `PBJ-100000` through `PBJ-999999`. Examples are illustrative. Node's cryptographic random generator runs only on the server. The original UUID remains the internal key, submission deduplication identifier and Resend idempotency identity.

## Apply to the existing Supabase project yourself

The application now calls `receive_holiday_enquiry_v2`. Apply this migration before sending another test enquiry with the updated code; until the function exists, new submissions fail safely rather than being falsely accepted. Existing notification retry functions remain available.

1. Pause new test submissions. In your existing Supabase project's SQL Editor, record the current rows with this non-sensitive operational query:

   ```sql
   select id, reference, notification_status, notification_provider_id
   from public.holiday_enquiries order by received_at;
   ```

2. Use your project's normal backup/snapshot procedure if available. Do not reset the project or rerun the initial table-creation migration.
3. In VS Code, open `supabase/migrations/20261013_friendly_enquiry_references.sql`. Copy the **entire file**, including BEGIN and COMMIT, into a new SQL Editor query in the same Supabase project. Review it and run it once yourself. It creates a reservation table, protective triggers and a versioned receive function. It does not delete, truncate, recreate or update existing enquiry rows.
4. Run the query from step 1 again. Existing IDs, references, notification statuses and provider IDs should be identical. Check the new reservations with:

   ```sql
   select e.reference,
          exists(select 1 from public.holiday_enquiry_reference_reservations r
                 where r.reference = e.reference) as permanently_reserved
   from public.holiday_enquiries e order by e.received_at;
   ```

   Every existing row should be reserved. The migration issues a PostgREST schema-cache reload notification. If a missing-function error persists, wait briefly and check that the migration committed in the correct project; do not disable RLS.
5. Restart your one development server and refresh the form to load current code. Do not start a second server or change `.env.local` for this improvement.

This is a single-use migration. A second attempt should fail and roll back rather than rewriting existing objects. If it reports an error, retain the message and investigate before retrying. There is no destructive rollback: keep reservation history permanently.

## Preservation and allocation

- Existing references remain exactly as issued, including long UUID-style references. Duplicating an existing enquiry returns its original reference; existing records are not assigned replacement aliases.
- Existing holiday briefs, notification snapshots, provider IDs, statuses, UUIDs and relationships are unchanged. The migration backfills only the new reservation table.
- All inserted enquiry references are permanently reserved by a database trigger and unique primary-key constraint. Reservations have no FK/cascade, so deleting an enquiry does not delete its reservation. Application credentials cannot update/delete/truncate reservations; triggers also prevent ordinary SQL updates, deletes and truncation. Never drop or disable this protection or remove reservation history when deleting customer data.
- The migration reserves every existing reference. Previously issued UUID-style values cannot collide with the new six-digit namespace. If short references were introduced and deleted by some other workflow before this migration, import that historical issued-reference list into the reservation table before enabling allocation; absent records cannot be reconstructed automatically.
- New candidates are generated with `crypto.randomInt(100000, 1000000)`. Only a confirmed reservation collision triggers a new candidate. Collisions roll back the receive subtransaction, including its quota increments, and do not change the submission UUID. Concurrent callers still meet the database's uniqueness constraint and existing transaction lock.
- A new enquiry and its immutable business email snapshot are persisted in the same transaction using the same candidate. Rejected candidates are never emailed. Duplicate calls return the accepted reference and retain the original email snapshot. Resend still uses `holiday-enquiry/<internal UUID>`; no retry/idempotency key changes.
- The customer API returns the reference only. Internal UUIDs remain in server-side operations and are not added to the receipt or business email summary.
- There are 900,000 available friendly values. References are never recycled. Allocation is bounded (12 candidate attempts with a 15-second loop deadline, plus bounded database request time); repeated collisions or exhaustion fail safely. If the namespace ever approaches exhaustion, approve a larger format in a separate change. Do not reset reservations to create capacity.

## Verify after applying

1. Submit a new, distinct test brief using your own details. Its confirmation should show the new heading, preferred-contact response text and a reference matching `^PBJ-[1-9][0-9]{5}$`.
2. Click Copy reference and paste it into a plain text editor. If the browser denies clipboard access, the confirmation offers a manual-copy message.
3. In Supabase, locate the row by `reference`. Its `id` should still be a UUID. The saved `notification_email.text` should contain the exact same short reference, and its Resend idempotency key still uses that internal UUID.
4. Check the real business inbox. New emails include the friendly reference in the body; email subject formatting is unchanged. Previously queued messages retain their original content/reference, even if retried after this migration.
5. Repeat the same recent brief to exercise existing deduplication: the original reference must be returned and a second enquiry/email must not be created. Use a genuinely different brief for a separate reference test; random numbers need not increase.
6. Recheck your first successful existing enquiry: its original long reference and stored email remain valid and unchanged. Do not delete real rows simply to test reservation retention; that case is covered by disposable local PostgreSQL fixtures.

## Editing and tests

Confirmation text and copy-button labels live in `src/content/enquiry.ts`. Layout uses existing styles in `src/app/enquiry.css`. Server generation and collision retry live in `src/lib/enquiries/references.ts`; database authority is in the new migration. Changing the format later requires coordinated schema/generator/tests updates, not just marketing copy edits.

`npm test` covers repeated random generation, six-digit bounds, collisions, bounded failure, overlapping allocations, duplicate UUID/content requests, unchanged old rows and snapshots, no reuse after a fixture enquiry is deleted, private reservation access, unchanged retries, and confirmation/copy behaviour. PGlite's local PostgreSQL connection serialises actual SQL execution; overlapping Promise requests test the allocation workflow but do not represent multiple networked Supabase connections. The constraints/transaction lock enforce deployed concurrency; no live migration or external delivery test was executed by Codex.
