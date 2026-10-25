# Privacy final actions — 22 October 2026

This is the current completion list. Confirmed New Travel registrations and the website GDPR agreement are closed facts, not requests for reconfirmation. No hosted settings, data, secrets, live-enquiry flags or deployment changed.

## 1. Confirmed facts and completed text

Planned by Jay trades on behalf of New Travel Holidays Limited (16135195; ICO ZB868696; ABTA P8763). Jay confirms the agreement specifically covers GDPR responsibilities for customer information collected through this website. Jay handles enquiries and receives privacy requests at jay@plannedbyjay.com, coordinating with New Travel. Contractual coverage does not by itself determine controller/processor classification for every activity.

Privacy now explains initial enquiry fields, Supabase records and immutable notification snapshots, Resend notifications, Vercel and mailbox copies, later secure passenger-data collection, no automatic VHUB transfer, rights and complaints. It identifies international processing, including Resend’s documented US storage, without claiming actual account safeguards are verified. Lawful-basis proposals are kept in POLICY-APPROVAL-CHECKLIST.md until confirmed and inserted as settled customer wording; internal implementation/audit commentary was removed from customer paragraphs.

Cookie text incorporates [COOKIE-AUDIT-RESULTS.md](COOKIE-AUDIT-RESULTS.md): 24-hour enquiry cookie, authentication attributes, 400-day write maximum versus session validity, explicit PKCE variants and abandoned-entry qualification. Optional Cloudflare features remain conditional; no specific Vercel cookie is asserted active. No identified implementation currently justifies adding a banner. Actual browser stores were unavailable to the audit tool; no absence claim is made.

Booking Information remains approved in source. Privacy and Cookies remain unapproved and guarded; footer/sitemap and Stage 3 privacy link continue to follow the same publication guard. Publication does not enable enquiries.

## 2. Operational procedure adopted

[ENQUIRY-DATA-RETENTION.md](ENQUIRY-DATA-RETENTION.md) assigns Jay a monthly review and normal deletion of inactive unsuccessful enquiries 12 months after last meaningful customer contact. It covers contact evidence, bookings/active work, justified holds, all copies, backups, privacy requests and a minimal restricted action log.

The engineering gap is now resolved in the un-applied `20261022_safe_enquiry_erasure.sql` migration: separate outstanding-attempt tracking survives expired/replaced leases; row-locked erasure refuses unresolved workers/outcomes and preserves permanent reference reservations. Existing rows receive legacy-review blockers without changing briefs or snapshots. No deletion or hosted migration was performed. Jay approves installation separately, then each eligible exact-record erasure. Legacy/orphan blockers still need evidenced worker termination and outcome reconciliation, not merely a lease expiry. See the retention guide for precise SQL and refusals.

## 3. Matters requiring formal approval

- Agree the activity-level role allocation under the confirmed GDPR agreement, including Jay’s legal identity where required. Do not guess sole/joint controller or processor labels.
- Sign off the basis map and LIA below. Contract applies only to necessary steps with the relevant controller; legitimate interests is proposed for expected assistance outside those steps, limited correspondence and proportionate security. Other passengers and later special-category data require separate assessment. Do not treat proposed wording as a completed legal assessment.
- Approve/install the safe-erasure migration and exact-record procedure, plus provider/backup handling and accountability-log retention. The code is tested; the 12-month rule and monthly owner are already adopted.
- Review administrator authentication/recovery persistence necessity and complete the limited production-storage evidence gap.
- After resolving the applicable review IDs, approve each complete policy text separately. Neither remaining approved flag has been changed.

## 4. External account evidence still unavailable

| Account owner / location | Exact evidence needed |
| --- | --- |
| Supabase: Free / West EU confirmed by Jay; backups/PITR, Auth/SMTP and legal terms | Actual backup/log/Auth retention, recovery provider and applicable agreements/transfer terms; cookie maximum is not token validity. Do not re-ask the supplied plan/region. |
| Resend: Free / Ireland sending / US storage confirmed; legal and retention/support | Applicable DPA/transfer mechanism, actual retention and erasure process. Sending region does not determine storage. |
| Vercel: Hobby / London functions confirmed; legal/logs/protection | Resolve commercial hosting eligibility; applicable processing agreement, transfer coverage, log retention and any actual platform storage. No plan change authorised. |
| Microsoft 365 through GoDaddy, confirmed by Jay | Actual mailbox geography, retention/holds, access/forwarding and applicable transfer terms; provider identity is no longer outstanding. |
| Authorised browser/account reviewer | Names/attributes-only storage evidence and auth/recovery lifecycle, never values/passwords. Conditional Turnstile/pre-clearance or Vercel features need checking only if used; absence of an optional feature is not a blocker. |

International safeguards must be confirmed for the actual contracts/accounts before Privacy approval; generic provider availability of SCCs, UK Addenda or adequacy does not establish applicability. Public provider references remain in [PRIVACY-READINESS.md](PRIVACY-READINESS.md) and the cookie audit. No UK-only-processing claim is made.

Next: resolve the short list above, update only supported policy facts, obtain explicit final-text approval, then use the existing per-policy publication guards in a separately authorised release. No renewed investigation into the confirmed registrations is required.

## Verification of this completion

All 40 existing tests, lint, TypeScript and production build passed. The initial sandboxed build stalled; the same build completed outside the sandbox. Local production HTTP checks confirmed Privacy/Cookies 404, Booking Information and Holiday Brief 200, and the Booking Information footer link without unapproved policy links. Existing tests exercise the Stage 3 privacy link before/after approved URL availability and route approval guards. No form submission was made. The existing localhost testing allowance differs from the public-origin approval gates; no environment values or gates were changed, and this is not evidence of public activation.

Both draft documents were rendered through the existing presentation component and stylesheet in a temporary localhost-only preview without changing approval flags. At 375/390/440px window sizes (360/375/425px document content widths after scrollbars), neither had horizontal overflow. Actual mobile screenshots were inspected. Preview files, servers and browser sizing overrides were removed/stopped/restored afterwards.

### Final infrastructure completion (supersedes earlier sitemap limitation)

The old uncaught CMS read could abort the sitemap. The current local production read identifies a CMS transport failure; exact network/DNS/project cause is not established. New narrow published-only retrieval emits a fixed safe warning and serves actual stable routes during failure. Local `/sitemap.xml` now returns 200/four stable URLs; deployed public sitemap returned 200/three URLs before deployment of this change. No current production outage or Supabase pause is inferred. Existing article routes/invalidation remain unchanged.

All **42** tests, lint, TypeScript and production build passed, including new sitemap and erasure/interleaved-worker fixtures. The new SQL preserves existing rows, blocks public roles and unsafe erasure, supports retries and retains issued references. No hosted multi-connection load test or live deletion was performed. Policy guards still return Privacy/Cookies 404 and Booking Information 200 with its footer link. See [LAUNCH-HANDOVER.md](LAUNCH-HANDOVER.md) for the final practical action list, including the genuine Vercel Hobby commercial-use issue and protected scheduling. No approval or environment flag changed.
