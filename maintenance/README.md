# Run the Planned by Jay application reset in SQL Editor

Jay has explicitly authorised disposal of the abandoned application data. An incomplete historical dummy-data export is not a blocker. Preserve the existing Git recovery branch and local archives. No hosted SQL was executed while correcting this file.

## Why the previous run stopped

The first `$guard$` block checks `current_setting('pbj_reset.confirmed_project_ref',true)` and `current_setting('pbj_reset.disposal_authorised',true)`. They must equal `watlnbiurgavvlalqwqz` and `true`. Previously the SET statements were commented out, so running the file did not initialise them. SQL Editor executions may also use different sessions. The STOP was conditional, not a rejection of Jay's authorisation. That guard runs before the DROP statements, so this reported error did not execute the reset's DROP statements.

The corrected file contains a clearly labelled `$manual_authorisation$` block inside the transaction. It requires two explicit edits, then supplies transaction-local settings in the same execution. No CLI, environment variable, new migration or backend is involved.

## Exact one-run instructions

1. Open **Supabase > Planned by Jay > SQL Editor > New query**. Verify **Project Settings > General > Project ID**, and the dashboard URL's `/project/` identifier, both show **`watlnbiurgavvlalqwqz`**. Do not use QuizHub or rely only on the friendly project name. SQL Editor cannot independently establish the hosted project reference; this dashboard check is mandatory.
2. Confirm **Storage** has no **`editorial-images`** bucket. Its three objects and bucket were removed and verified during the earlier authorised cleanup. If it exists again, review its contents and remove only that application bucket through Storage dashboard/API. Do not delete Storage metadata with SQL or touch unrelated buckets.
3. Paste the **entire current `maintenance/RESET-PLANNED-BY-JAY.sql`** into the query.
4. In the labelled `$manual_authorisation$` block change only these two declarations:

   ```sql
   verified_project_ref text := 'watlnbiurgavvlalqwqz';
   authorise_application_reset boolean := true;
   ```

   Keep the separate fixed project check and all scope checks unchanged. Do not uncomment old SET commands or run authorisation in a separate query.
5. Run the **whole file once as `postgres`/database owner**, including `begin`, authorisation, guards, DROP statements, `commit` and verification queries. Clear any text selection so SQL Editor does not execute only a fragment. If a previous failed transaction remains open, run `rollback;` first. On a new error, stop and inspect it; do not remove the scope guard or substitute a different project reference.
6. After success, each of the five verification queries must return **zero rows**: application tables, application functions, private schema, application bucket and application Storage policies. If a guard fails, the transaction does not complete; roll it back. If verification returns rows, do not claim the reset is complete.

## Reviewed scope

The explicit targets match the recovery inventory: **22 application tables** (17 public plus five in `cms_private`), **37 public function names**, the application-owned **`cms_private` schema**, and **seven named application policies on `storage.objects`**. Triggers and policies belonging to dropped application objects are removed with them. Historical renamed function versions are included.

The script does not explicitly drop `public` itself, `auth`, `storage`, provider roles, extensions, migration history, Realtime or Vault infrastructure. It does not delete `auth.users` or modify email configuration. It uses CASCADE for the reviewed application objects, with guards for unknown private relations and outside table/view dependencies; unexpected dependencies must be reviewed rather than bypassed. SQL cannot prove that an arbitrary unseen database has no additional custom dependencies. The correct project and scope review remain essential.

Auth account deletion is separate: before dropping the administrator mapping, an owner can record its `user_id` values for comparison in Authentication > Users. Delete only accounts positively identified as abandoned website accounts through supported Auth controls. No Auth account was deleted automatically. No replacement backend or deployment is part of this reset.
