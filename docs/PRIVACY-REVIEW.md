# Privacy Policy: ready for Jay's final review

The complete policy is `policies.privacy` in `src/content/policies.ts`. It covers the website and both enquiry routes. It remains `approved: false`, with no publication date; the only policy review entry is Jay's final approval. `/privacy` therefore remains unavailable and unlinked. No forms, backend, credentials, migrations or launch controls have changed.

## Established operational basis

Johnny-James Flynn is a self-employed consultant trading as Planned by Jay on New Travel Holidays Limited's behalf. Jay has confirmed that the agreement covers the website customer journey from initial enquiry through booking, including customer-information responsibilities. The policy names both parties, explains Jay's day-to-day handling and gives one contact for privacy requests. It does not invent sole-controller, joint-controller or processor classifications. Do not send Jay back to New Travel to repeat this confirmation.

The policy retains the previously adopted monthly manual review and normal deletion of inactive unsuccessful enquiries 12 calendar months after last meaningful customer contact. It describes actual private Supabase storage, Resend notifications to Jay, Microsoft 365 through GoDaddy, pending-email recovery and administrator-only sign-in cookies. Initial enquiries are not automatically forwarded to New Travel or suppliers. There is no marketing subscription, active CAPTCHA or application analytics. The Holiday Brief is still a read-only preview with no submission connection; the policy describes its existing fields and does not pretend it is operational.

## Published provider safeguards checked on 27 October 2026

| Provider | What the official terms establish | Limit of the evidence |
| --- | --- | --- |
| Supabase | The [standard DPA](https://supabase.com/legal/customer-resources/data-processing-addendum) forms part of its service agreement. Schedule 2 incorporates the EU SCCs and UK Addendum for relevant UK transfers. | No separate negotiated agreement or completed customer transfer assessment was inspected or claimed. A West EU project does not imply every provider activity stays in Europe. |
| Resend | Its [DPA](https://resend.com/legal/dpa) is incorporated through acceptance of the service terms; section 6.4 includes SCCs with the UK Addendum for relevant UK transfers. | Ireland sending and US storage differ. No bespoke agreement or completed customer transfer assessment is claimed. |
| Microsoft 365 through GoDaddy | GoDaddy's [DPA](https://www.godaddy.com/en-uk/legal/agreements/data-processing-addendum), effective with the service agreement, provides UK transfer terms in Schedule 4. Its [Microsoft 365 terms](https://www.godaddy.com/en-uk/legal/agreements/microsoft-office-terms-of-use) incorporate the Microsoft Customer Agreement, including privacy terms. Microsoft also publishes its [product DPA](https://www.microsoft.com/licensing/docs/view/Microsoft-Products-and-Services-Data-Protection-Addendum-DPA). | Mailbox geography, holds and account-specific amendments were not independently inspected. No universal UK-only storage, fixed backup-erasure deadline or individually signed terms are claimed. |
| Vercel | Its [DPA](https://vercel.com/legal/dpa), introduction and Schedules 3/5, describes Pro/Enterprise coverage and UK transfer clauses. [General terms section 11](https://vercel.com/legal/terms) incorporate the DPA by reference. | The DPA's stated plan scope does not establish full processor coverage for the recorded Hobby account. This is a specific hosting issue, not a request to negotiate new terms with every provider. |

These are documented standard mechanisms, rather than a blanket assertion that all account-specific arrangements or transfer assessments have been verified. The customer policy reflects that distinction and links directly to the terms. No additional data-protection infrastructure is required for this wording.

## One material operational issue: recorded Vercel Hobby plan

The last owner-confirmed hosting plan in project history (`0edead6:docs/PRIVACY-FINAL-ACTIONS.md`) is Vercel Hobby. The current [Hobby documentation](https://vercel.com/docs/plans/hobby) limits it to personal, non-commercial use. Planned by Jay is a commercial consultancy. Before live enquiry processing, Jay should move the existing project to Vercel Pro with its applicable DPA, or retain evidence of an already-completed equivalent commercial arrangement. No plan purchase, account change or deployment has been made here. This does not require any CMS/form rebuild or another New Travel confirmation.

## Publication and delivery test

1. Jay reviews this final wording. After approval, clear the final `reviewRequired` entry, set `updatedAt` to the actual review/publication date and set `approved: true`. Jay commits/deploys himself on eligible hosting. `/privacy`, the footer and both forms then use the same policy automatically.
2. Keep `deliveryVerified=false`. Run the existing owner-contact test SQL once, then use **Admin > Offer enquiries > Retry email notification**. Confirm actual receipt in `jay@plannedbyjay.com` (including junk), the saved holiday details and Reply-To. Exact SQL and recovery instructions: [OFFER-ENQUIRY-LAUNCH.md](OFFER-ENQUIRY-LAUNCH.md#short-owner-controlled-production-test).
3. Only after policy publication and successful mailbox delivery should the existing offer `deliveryVerified` control be enabled through Jay's normal deployment process. Neither has been enabled here. The bespoke Brief remains read-only; its absent submission connection cannot be activated just by approving a policy or checking an email.

Keep applying the existing retention procedure to database and email copies. The admin area reviews/retries notifications; it is not a deletion interface. An authorised database owner handles applicable erasure and related copies. Submission times and notification retries do not establish last meaningful customer contact.

## Checks

The final wording passed all 50 tests, lint, TypeScript and production build, including private-policy guards and shared links. Production `/privacy` remains not-found with the policy text absent. Earlier mobile/desktop preview checks passed at 320, 390, 900 and 1440 pixels; presentation code is unchanged. File hashes confirm forms, backend, CMS, migrations and other content were untouched during this update. No live customer enquiry or email was sent by these checks. The available local runtime is Node 20 (tests used a temporary WebSocket shim); the project specifies Node 22.13 or later.
