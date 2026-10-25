# Privacy readiness — current policy status

Refined **22 October 2026**. Booking Information is approved in source; Privacy and Cookie Policy remain unapproved. This note separates confirmed business facts from the technical evidence and business decisions still needed. Use [POLICY-APPROVAL-CHECKLIST.md](POLICY-APPROVAL-CHECKLIST.md) for exact owners, effects and publication instructions.

## Already confirmed

Dale and Paul/New Travel supplied the approved reference wording. Company 16135195, VAT 482 4625 76, ABTA P8763 and ICO ZB868696 are confirmed New Travel Holidays Limited details. Planned by Jay trades on its behalf; memberships are not independently attributed to Planned by Jay. The supplied Burnley address remains a head office. These details are not outstanding verification items.

The booking model is also settled: Jay researches/advises and helps arrange through New Travel. Existing operator packages use their identified organiser’s applicable conditions plus relevant agency terms. Newly assembled packages require an approved structure and identified organiser before being offered. No universal supplier conditions URL is needed. Booking Information has Jay’s explicit approval, an empty review list and `approved: true`; it is publishable through the existing route/footer/sitemap system on the next owner-authorised deployment.

The initial Holiday Brief remains separate from later secure New Travel booking collection, including VHUB where appropriate. No customer passport/document/payment collection or automatic VHUB transfer is implemented in this website.

## Technical inventory and verification

| Technology / records | Source-established behaviour | Actual configuration evidence still needed |
| --- | --- | --- |
| Initial Holiday Brief | Contact details, travel requirements, counts/children’s ages, budget/intention, preferences and optional private-discussion flag. No passport/identity-document/payment fields. Answers remain in page memory, not local/session storage. | Deployed enabled flow and provider processing; no live test submission authorised here. |
| Enquiry session | `pbj-enquiry-session`; issued on an enabled submit attempt. Signed identifier/timestamp; host-only, path `/api/enquiries`, HttpOnly, SameSite Strict, Secure on HTTPS, max-age 86400 seconds and server age check. | Production cookie attributes/behaviour. Customer inventory simplifies this to purpose/provider/24-hour duration. |
| Administrator sign-in | Supabase `sb-<project-ref>-auth-token`, possibly `.0`, `.1`, etc.; HttpOnly, SameSite Lax, Secure on HTTPS, path `/`. Installed SSR cookie-write maximum: 400 days. Session/token validity is separate. | Actual authenticated expiry, refresh, revocation and sign-out behaviour; no account settings changed. |
| Password recovery | Supabase PKCE names: `sb-<project-ref>-auth-token-code-verifier`, `sb-<project-ref>-auth-token-flow-<id>-code-verifier`, `sb-<project-ref>-auth-token-flows-code-verifier`, with chunks if needed. Adapter writes the same 400-day browser maximum; flow consumes/clears verification entries. | Real recovery cookie lifecycle and configured link/token expiry; SMTP/recovery provider. Never describe 400 days as recovery-link validity. |
| Optional Cloudflare Turnstile | Only stage 3 of configured/enabled form; browser/device security checks and server verification. `cf_clearance` is conditional on account pre-clearance settings. | Actual activation/storage purposes/durations; necessity assessment. Do not invent an always-present cookie or enable the integration for this review. |
| Supabase and Resend | Brief saved durably; immutable business-notification snapshot; notification retries/status/provider IDs. Resend handles summary, customer Reply-To; mailbox copies and correspondence. No customer receipt email. Application rate records use protected email/session hashes, not raw IP. | Actual account regions, providers/agreements/roles, mailbox access and retention, overseas processing/safeguards, logs/backups. Provider acceptance is not evidence of inbox delivery. |
| Vercel/public browsing | Hosting and network/log/security processing; system fonts/local assets. No source analytics, marketing pixels, embedded offers feed or service worker. Public CMS clients are anonymous/non-persistent; administrator auth is separate. | Actual dashboard additions/security storage, log settings, regions/transfers. Anonymous observed scripts/frames are not a full HttpOnly-cookie/account audit. |
| Editorial media | Public Supabase editorial images; uploads re-encoded with metadata removed. Customer documents do not belong in this public bucket. | Rights/access/operational retention as appropriate. CMS/security functionality unchanged. |

Technical evidence: `src/lib/enquiries/security.ts`, `src/app/api/enquiries/session/route.ts`, `EnquiryForm.tsx`, `Turnstile.tsx`, `src/lib/cms/client.ts`, `src/proxy.ts`, installed `@supabase/ssr/src/utils/constants.ts` and `src/cookies.ts`, and `@supabase/supabase-js/src/SupabaseClient.ts`. These source facts do not establish hosted dashboard settings.

No non-essential tracking was found in source or the limited anonymous public-page observations. No decorative banner is added. Any non-exempt technology found/added must remain off until the required consent controls exist. Cookie publication remains guarded pending the actual deployed inventory.

## Business decisions and legal assessment

- Settle and insert the actual controller/legal contact allocation for Jay’s website enquiries versus New Travel’s later booking processing. Registrations alone do not decide this.
- Confirm and insert lawful bases by purpose, legitimate interests where relied on and any relevant later booking-stage basis. The readable draft explains purposes but does not assert an unsettled basis.
- Adopt the **proposed 12-month review/normal deletion rule after last meaningful contact** for inactive, non-booked enquiries. It is a business rule, not a statutory requirement. The customer draft describes the intended manual policy; there is no automatic deletion job or new last-contact field. Before publishing, assign a reviewer/frequency, evidence the contact date, and handle exceptions and requests across Supabase briefs/immutable notification snapshots, email/provider copies and backups. Retain reference-only reservations without retaining all customer data indefinitely. Do not reset tables or rewrite pending snapshots.
- Complete actual processor locations and international-transfer safeguards, including how copies are obtained. The draft’s short processing-location paragraph is not a substitute for those facts; it remains blocked by `processors-and-transfers` until completed.

These are the current Privacy publication blockers. Cookie policy has only its genuine deployment/lifetime checks. Booking Information has no remaining factual review IDs and its final text is now explicitly approved. None of these decisions authorise live enquiries, indexing, a deployment, new sensitive-data collection or a VHUB integration.


For the final source data flow, provider research (including Supabase, Resend, Vercel, Microsoft 365 and conditional Turnstile), candidate lawful bases/controller allocation and safe manual retention steps, use [PRIVACY-FINAL-ACTIONS.md](PRIVACY-FINAL-ACTIONS.md). These are proposals/account checks, not automatic policy or enquiry approval.
