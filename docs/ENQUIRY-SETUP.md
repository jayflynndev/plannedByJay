# Holiday enquiry operations

The owner has verified a controlled end-to-end enquiry: the form saved to Supabase, Resend sent the business notification and the email reached the business inbox. Codex's local regression tests use synthetic data and mocked email responses. The friendly-reference improvement requires the separate manual migration below; it has not been applied by Codex. Public launch remains subject to the existing approval/privacy configuration.

## Files and flow

| Responsibility | Location |
| --- | --- |
| Editable copy/options | `src/content/enquiry.ts` |
| Shared input validation | `src/lib/enquiries/schema.ts` |
| Three-stage form | `src/components/enquiry/EnquiryForm.tsx` |
| Server configuration gate | `src/lib/enquiries/config.ts` |
| Cookie signature, hashing, Turnstile verification | `src/lib/enquiries/security.ts` |
| Stream size limit / honeypot | `src/lib/enquiries/request.ts` |
| Durable receive/claim/finish adapters | `src/lib/enquiries/store.ts` |
| Business email template | `src/lib/enquiries/email.ts` |
| Notification processor | `src/lib/enquiries/notifications.ts` |
| API handlers | `src/app/api/enquiries/` |
| Database migration | `supabase/migrations/20261012_holiday_enquiries.sql` |

Validated brief → atomic durable record with email snapshot → claim notification lease → Resend attempt → record acceptance or failure. Customer confirmation means the brief was received, not booked and not necessarily delivered to the business inbox. No customer acknowledgement email is implemented.

## 1. Supabase

For an **already configured project**, the reference improvement requires the separate `supabase/migrations/20261013_friendly_enquiry_references.sql` migration, applied manually by the owner. Do not rerun the initial table creation. Exact steps and preservation checks are in [ENQUIRY-REFERENCES.md](ENQUIRY-REFERENCES.md). For a new empty project, apply the initial migration first and the reference migration second. The updated application uses `receive_holiday_enquiry_v2`; existing retry functions and snapshots remain unchanged.

Create your own project and select an appropriate hosting region and backup plan. In SQL Editor, run the migration once. It creates `holiday_enquiries`, `holiday_enquiry_limits` and three service-only functions. Do not rerun against tables already containing real enquiries or disable RLS to solve setup errors. There are no anon/authenticated read/write policies or function grants. RPCs use SECURITY INVOKER, an empty search path and schema-qualified table references.

Store `SUPABASE_URL` and a server secret API key in `.env.local`; a modern `sb_secret_…` key is preferred. Legacy service_role JWT keys are also supported. Never use an anon/publishable key here, never prefix secrets with NEXT_PUBLIC_, and never give customer browsers database credentials. See the official [Supabase key guidance](https://supabase.com/docs/guides/getting-started/api-keys) and [function privileges](https://supabase.com/docs/guides/database/functions).

The mobile refinement needs no additional SQL migration. New records use the optional, trimmed `brief.departurePreferences` string (maximum 300 characters). This replaces the form's `departures` array and `departureOther` field inside the existing JSONB column; RPC arguments and tables are unchanged. If no database exists, run the original migration. If already deployed, do not rewrite old records or their fingerprints/email snapshots. Old notifications remain retryable because the processor sends their stored immutable email, not a template reconstructed from the brief. Existing old-format browser submissions should be refreshed rather than sent to the revised strict schema.

The durable record stores the holiday brief, contact details, immutable notification email, reference, received time, notification attempts/status/provider ID and retry fields. Rate keys are HMAC hashes of email and signed session ID; raw IP addresses are not collected. Old rate buckets are cleaned on new accepted traffic. Jay has adopted monthly review and normal deletion of inactive unsuccessful enquiries 12 months after last meaningful customer contact. Follow [ENQUIRY-DATA-RETENTION.md](ENQUIRY-DATA-RETENTION.md), including the separately approved `20261022_safe_enquiry_erasure.sql` migration and exact-record RPC. Never use an unguarded row deletion to bypass notification safety.

## 2. Resend and environment

Configure Resend, verify a sender domain you control and obtain a server-side API key. The verified sender is `ENQUIRY_EMAIL_FROM`, and the business recipient is `ENQUIRY_EMAIL_TO`. The customer email is Reply-To, never the From address. The notification contains both escaped HTML and plain text, all submitted fields, a UTC timestamp and unique reference. See [Resend Send Email](https://resend.com/docs/api-reference/emails/send-email).

Copy `.env.example` to `.env.local` yourself and fill in values. Keep `.env.local` private; it is ignored by Git. Generate two different random secrets, each at least 32 characters. For example, run this locally once for each secret and place the output only in `.env.local`:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Use `APP_ORIGIN=http://localhost:3000` for the default development port, with no trailing slash. Change it if using another port. Enable only the controlled local test with `ENQUIRIES_ENABLED=true`. Restart the server after environment changes. If configuration is incomplete, mismatched or unapproved, both the page and server reject submission; no fake success or local pseudo-database is used.

`ENQUIRIES_LIVE_APPROVED` and `ENQUIRY_PRIVACY_APPROVED` stay false in this phase. Non-local origins require both, HTTPS and the configured approved privacy link. Do not enable public submission without Jay's explicit approval.

## 3. Genuine email test

1. Configure the SQL and credentials above; use an inbox you control as the recipient.
2. Open `/plan-my-holiday` locally. Complete all stages with your own test contact details, and send the brief.
3. Note the reference displayed in the confirmation. In Supabase, locate that reference and check `brief`, `notification_status`, `notification_attempts` and `notification_provider_id`.
4. Inspect the corresponding Resend log. `accepted` records provider API acceptance; review provider delivery/bounce status separately.
5. Check the actual business inbox and spam folder. Inspect the mobile/email-client rendering, complete field summary and Reply-To behaviour. Do not infer inbox receipt from a 200 API response.
6. Submit the same brief again to confirm it resolves to the same recent record. Then test a distinct enquiry. Rate limits allow three new briefs per email per UTC hour and five per signed session per UTC hour; exact duplicates do not consume a new quota.

Use synthetic holiday information for tests, not real customer records or medical details. Remove individually authorised test records only through the safe erasure procedure after its migration; resolve legacy/attempt blockers first. A change to recipients affects only new snapshots: existing pending messages retain the original address so retries preserve idempotency.

## 4. Notification statuses and monitoring

| Status | Meaning / action |
| --- | --- |
| pending | Brief received; first send still needs processing |
| sending | A worker owns a 90-second lease; stale leases can be reclaimed |
| accepted | Provider accepted the email and returned an ID; not proof of delivery |
| failed | Attempt failed; retry due after exponential backoff |
| manual_review | Six attempts exhausted or the safe idempotency window expired; operator reconciliation required |

In Supabase SQL Editor, use a restricted operational query that avoids displaying the full customer brief:

After the safe-erasure migration, each claim also creates a separate outstanding-attempt blocker. Completion releases only its own blocker, including a stale completion that cannot change the current lease/status. A crashed worker or failed finish RPC leaves a blocker; it never expires automatically with the 90-second lease. This preserves retry behaviour while preventing unsafe erasure. Do not delete blockers as routine queue maintenance. Legacy/orphan reconciliation is restricted and documented in ENQUIRY-DATA-RETENTION.md.

```sql
select reference, received_at, notification_status, notification_attempts,
       notification_first_attempt_at, notification_provider_id,
       notification_last_error, notification_next_attempt_at, lease_until
from public.holiday_enquiries
where notification_status <> 'accepted'
order by received_at;
```

Alert on manual_review, stale leases and a growing/old pending queue. Operational logs show safe event codes and references only, not raw provider errors/customer details. Database outage errors cannot reliably be monitored in that same database; use the hosting error log/monitoring. Restrict account access and set up backups and restoration tests.

## 5. Scheduler and manual retry

No external scheduler is connected. Configure a scheduler capable of HTTPS POST and a private Authorization header to call `/api/enquiries/retry` every minute. Configure hosting request duration to allow 60 seconds (the handlers declare this maximum where the host supports it). Store `ENQUIRY_RETRY_SECRET` only in the scheduler's secret store and application server. Never include it in a URL. One due record is processed per call; if traffic grows, increase authenticated worker calls with measured capacity. Database leases prevent overlapping workers sending the same record simultaneously.

For a controlled local retry in PowerShell, type the secret into a hidden prompt:

```powershell
$retryCredential = Read-Host 'Retry secret' -AsSecureString
$retryToken = [System.Net.NetworkCredential]::new('', $retryCredential).Password
Invoke-RestMethod -Method Post -Uri 'http://localhost:3000/api/enquiries/retry' -Headers @{ Authorization = "Bearer $retryToken" }
Remove-Variable retryToken, retryCredential
```

The response contains processed/failed counts only. Check database status afterwards. Backoff starts at 60 seconds and doubles for subsequent failures, capped at an hour. Repeated clicks before a due time return zero processed.

Resend [idempotency keys](https://resend.com/docs/dashboard/emails/idempotency-keys) expire after 24 hours. Each immutable notification uses `holiday-enquiry/<record UUID>`. Automatic retries stop after 23 hours from first attempt or six attempts. This prevents an ambiguous timeout being retried indefinitely after provider deduplication expires.

For manual_review, first reconcile the Resend logs by reference/subject, idempotency key and provider ID:

- **Provider already accepted it:** record the known provider ID and mark it accepted; investigate actual delivery separately. Do not resend blindly.
- **Confirmed no message was accepted:** correct the configuration, then deliberately reset the queue entry through the authorised SQL editor. Keep the email snapshot unchanged. If changing its recipient/content is required, design a separately authorised notification generation with a new idempotency key; do not mutate a message still within the provider window.
- **Uncertain whether it was accepted:** keep manual_review and investigate with provider support. Do not automatically requeue.

Only after confirmation that the original message was never accepted, use this with the specific reference, never a whole-table reset:

```sql
update public.holiday_enquiries
set notification_status = 'pending', notification_attempts = 0,
    notification_first_attempt_at = null, notification_next_attempt_at = now(),
    notification_last_error = null, lease_token = null, lease_until = null
where reference = 'REPLACE_WITH_THE_SPECIFIC_REFERENCE'
  and notification_status = 'manual_review';
```

Then call the protected retry endpoint and verify database, provider and inbox. If acceptance is confirmed in provider logs, record it instead:

```sql
update public.holiday_enquiries
set notification_status = 'accepted',
    notification_provider_id = 'REPLACE_WITH_CONFIRMED_PROVIDER_ID',
    notification_accepted_at = now(), notification_last_error = null,
    lease_token = null, lease_until = null
where reference = 'REPLACE_WITH_THE_SPECIFIC_REFERENCE'
  and notification_status = 'manual_review';
```

Here the acceptance timestamp records reconciliation time. Retain the provider's original timestamps in your operational evidence. Do not label this as delivered.

## 6. Spam, security and hosting

The form uses shared strict Zod validation, field/count limits, a 24 KB streamed request-body limit, an explicit honeypot rejection, signed HttpOnly SameSite=Strict session cookies, same-origin POST checks, stable submission UUIDs, 24-hour identical-brief deduplication and durable atomic email/session rate counters. Rate limits do not use IP addresses, so customers sharing a network are not automatically grouped together. Invalid/spam submissions are explicitly rejected, never shown a fake success.

These application controls are a foundation, not a substitute for host-level abuse monitoring and request/body/time limits. A bot can acquire fresh sessions and rotate email addresses. Monitor actual abuse before adding friction. Optional Turnstile support is implemented: configure both TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY, restrict the widget to approved hostnames, and verify it in staging. The script loads only when configured; server verification checks success, hostname and holiday-enquiry action. Tokens expire/are single-use; failed attempts reset the widget. See [Cloudflare validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/).

Do not log bodies, expose enquiry data publicly, implement a customer account or add an enquiry dashboard. Monitor retry secret and API key access. When rotating the hashing/session secret, coordinate with pending customer submissions: changing hashes can affect deduplication across the transition.

## 7. Troubleshooting

- **Submissions disabled:** check ENQUIRIES_ENABLED, all mandatory values, exact APP_ORIGIN, secret lengths and matching Turnstile settings; restart the server. Public origins also need HTTPS, the two approval flags and an approved privacy link.
- **Session/origin error:** use the same origin/port as APP_ORIGIN and permit first-party cookies. Do not serve a public preview through a local origin configuration.
- **Database unavailable:** check URL/key type, migration and RPC grants. Confirm RLS stays enabled; never substitute a publishable key.
- **Provider 401/403:** check API credentials, permission and verified sender. Customers see safe wording; the row retains a safe failure code for business investigation.
- **Provider 429/5xx/timeout:** allow retry backoff. Confirm the scheduler is running and inspect stale leases/manual_review.
- **Accepted but no inbox email:** inspect Resend delivery/bounce logs, recipient spelling, spam rules and sender-domain configuration. Acceptance is not delivery.
- **Duplicate/conflict:** same submitted UUID cannot be reused for changed answers after receipt. Restore the original answers to check the original receipt or contact Jay before starting another enquiry. Exact same recent briefs also deduplicate across new UUIDs.
- **Rate limit:** wait for the next hourly bucket; no new record is created. Do not disable rate limiting to bypass a test; use controlled, distinct test sessions and addresses.

## 8. VHUB and live readiness

VHUB is not connected and no public API is assumed. A future authorised adapter belongs in `src/lib/vhub/`, after business selection of a genuine customer enquiry; manual export/import may be more appropriate. Keep an explicit conversion step separate from notification processing.

Before public enablement, obtain Jay's approval, complete the approved privacy page and data-retention/processing procedures, confirm agency/legal wording, verify sender/inbox, test successful genuine submission and email-failure recovery, configure the protected scheduler/monitoring/backups, review dependency advisories and test desktop/mobile/tablet/keyboard in a real browser. External providers and visual responsive behaviour remain unverified until those tests are performed. No deployment is authorised by this document.

## Mobile refinement verification

The form shows no errors before Continue/Submit is attempted; thereafter current-step errors update during correction without stealing focus. The Stage 3 holiday review uses the same departure text as the stored record and email. The development notice automatically disappears when the existing server configuration enables the form; these changes do not enable submissions.

Run `npm test`, lint, typecheck and build after changing fields. Regression coverage includes optional/multiple/no-flight/free-text departures, the 300-character bound, record and email summaries, retained Edit answers, delayed validation and accessible error focus, plus the existing queue, rate-limit and spam tests. Check actual 375px, 390px and 440px browser viewports for all stages, long error/review text, buttons and sticky-header focus. A DOM-only test is not a rendered mobile layout check.
