# Privacy and legal readiness — owner review, not approved policy text

Prepared routes: `/privacy`, `/cookies`, `/booking-information`. Their reusable layout reads `src/content/policies.ts`. They intentionally return 404, have no public footer/sitemap entry and remain noindex until approved text exists and `approved` is set. Do not publish an incomplete notice or put owner questions into a customer policy. No legal agreement or regulatory protection statement has been invented.

## Implemented technical facts to give the reviewer

| Area | Current implementation | Confirmation/action required |
| --- | --- | --- |
| Enquiries | Contact details and holiday brief stored in Supabase; immutable business-notification snapshots also contain those details. Form discourages passport, payment and detailed medical information. No customer account or marketing subscription is created. | Confirm controller/legal entity, relationship with New Travel and responsibilities for responding to data requests. Confirm whether any additional approved privacy wording is needed for private discussions. |
| Business email | Resend receives the enquiry summary for business notification; customer email is Reply-To. Business inbox copies may contain the same personal data. Provider acceptance is recorded separately from confirmed inbox delivery. No customer acknowledgement email is implemented. | Confirm approved business recipient, mailbox access/retention, processor arrangements, actual delivery and bounce monitoring. |
| Database/security | Customer tables are server-only; CMS editors are not granted enquiry access. Signed session IDs and email-based HMAC rate keys support abuse protection. Application rate limiting does not collect raw IP addresses. | Confirm actual Supabase project region, backups/restore, access controls, agreements and operational access. Hosting/provider logs may process network information separately; inspect real settings. |
| Enquiry cookies | `pbj-enquiry-session`, signed, HttpOnly, SameSite=Strict; security session issued through the existing session endpoint. Code controls expiry and same-origin checks. | Record actual browser cookie lifetime/domain/secure flags in production; explain purpose using confirmed deployment behaviour. Do not invent a universal cookie lifetime. |
| CMS authentication | Supabase Auth cookies are HttpOnly, SameSite=Lax and Secure on HTTPS. Password recovery uses Auth email/SMTP. No public CMS signup is implemented; administrator membership uses the private user-ID allowlist. | Confirm real account settings, recovery email configuration, session expiry/chunked cookie names, revocation and who manages access. |
| Editorial media | Dedicated public-read Supabase bucket for article photos, including draft/unused photographs. Upload flow strips image metadata and re-encodes. Private research notes/sources have separate protected storage. | Never upload private documents or customer photos without appropriate permission. Confirm photo rights and contributor/author information. |
| Hosting | Next.js on Vercel; framework asset/navigation handling and platform logs/caches. Local images and system fonts need no third-party font service. No analytics, advertising pixels, offers iframe or marketing-cookie tooling is implemented by this project. | Confirm actual hosting region, log retention/access, processors/subprocessors, international processing, deployment protection and any account-level integrations. Re-audit if adding analytics/embeds. |
| Optional Turnstile | Existing enquiry integration can be configured; both site/secret keys are needed. | Confirm whether it is actually enabled and include provider processing/technology details if used. Do not state it is active merely because code exists. |
| Retention/deletion | No approved enquiry-retention period or automatic enquiry deletion job is implemented. Rate buckets are cleaned during traffic. Media/notes/auth/email/logs/backups are separate stores. | Choose and implement approved periods/processes across all stores, including related email snapshots and permanent reference reservations. Preserve reference uniqueness and immutable retry snapshots; do not delete/reset enquiry tables. |

## Decisions still needed

- Precise legal entity name, mandatory trading/agency wording and any approved ABTA/ATOL membership/protection wording. The supplied company number/VAT/head-office details are recorded accurately; they do not establish a statutory registered-office address or independent Planned by Jay licences.
- Factually correct contact/controller details, purposes and approved basis for processing; how customers exercise rights and complain; any onward sharing once an enquiry progresses towards booking.
- Real retention periods, deletion/request procedures, provider/hosting locations and contractual processing/transfer arrangements. These cannot be established from source code alone.
- Supplier/agency booking terms, responsibility for bookings, cancellation/payment and financial protection statements, supplied by the appropriate party. Do not infer terms from a logo or from another consultant's website.
- Cookie/technology assessment against the actual deployed site. Decide any required controls with the reviewer; no speculative cookie banner/consent claim is added here.

## Approval sequence

1. Jay obtains factual/provider confirmations and approved wording from the appropriate agency/privacy reviewer.
2. Add complete policy sections and a real review date in `src/content/policies.ts`; approve only reviewed documents. Verify hidden/404 routes become the intended complete pages after the owner-authorised redeployment.
3. Separately set the enquiry's approved `privacyHref` only after the privacy page really exists. Keep `ENQUIRIES_ENABLED`, `ENQUIRIES_LIVE_APPROVED`, `ENQUIRY_PRIVACY_APPROVED` and indexing decisions under their existing explicit approval process. This phase changes none of those gates or secrets.
4. Before customer launch, perform a controlled end-to-end enquiry and failure/retry test, verify database/provider/inbox separately, inspect production cookies and verify retention/access/recovery procedures. Record evidence rather than treating a successful local build as legal or operational approval.

No hosted database change is required by these page scaffolds. This document inventories implementation and missing confirmations; it is not a published privacy notice or legal advice.
