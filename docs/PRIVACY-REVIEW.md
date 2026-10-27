# Privacy Policy: ready for Jay's final review

The approved policy is `policies.privacy` in `src/content/policies.ts`. Jay has confirmed `/privacy` is publicly accessible and a full public Holiday Offer enquiry was stored and notified successfully. The bespoke implementation uses the same notice and existing New Travel arrangement; only its technical form/storage description has been brought up to date. There is no new privacy approval process. See [BESPOKE-ENQUIRIES.md](BESPOKE-ENQUIRIES.md) for the manual migration and single activation switch.

## Established operational basis

Johnny-James Flynn is a self-employed consultant trading as Planned by Jay on New Travel Holidays Limited's behalf. Jay has confirmed that the agreement covers the website customer journey from initial enquiry through booking, including customer-information responsibilities. The policy names both parties, explains Jay's day-to-day handling and gives one contact for privacy requests. It does not invent sole-controller, joint-controller or processor classifications. Do not send Jay back to New Travel to repeat this confirmation.

The policy retains the previously adopted monthly manual review and normal deletion of inactive unsuccessful enquiries 12 calendar months after last meaningful customer contact. It describes actual private Supabase storage, Resend notifications to Jay, Microsoft 365 through GoDaddy, pending-email recovery and administrator-only sign-in cookies. Initial enquiries are not automatically forwarded to New Travel or suppliers. There is no marketing subscription, active CAPTCHA or application analytics. The Holiday Brief is now connected using those same services, with public collection closed until its manual setup is applied.

## Published provider safeguards checked on 27 October 2026

| Provider | What the official terms establish | Limit of the evidence |
| --- | --- | --- |
| Supabase | The [standard DPA](https://supabase.com/legal/customer-resources/data-processing-addendum) forms part of its service agreement. Schedule 2 incorporates the EU SCCs and UK Addendum for relevant UK transfers. | No separate negotiated agreement or completed customer transfer assessment was inspected or claimed. A West EU project does not imply every provider activity stays in Europe. |
| Resend | Its [DPA](https://resend.com/legal/dpa) is incorporated through acceptance of the service terms; section 6.4 includes SCCs with the UK Addendum for relevant UK transfers. | Ireland sending and US storage differ. No bespoke agreement or completed customer transfer assessment is claimed. |
| Microsoft 365 through GoDaddy | GoDaddy's [DPA](https://www.godaddy.com/en-uk/legal/agreements/data-processing-addendum), effective with the service agreement, provides UK transfer terms in Schedule 4. Its [Microsoft 365 terms](https://www.godaddy.com/en-uk/legal/agreements/microsoft-office-terms-of-use) incorporate the Microsoft Customer Agreement, including privacy terms. Microsoft also publishes its [product DPA](https://www.microsoft.com/licensing/docs/view/Microsoft-Products-and-Services-Data-Protection-Addendum-DPA). | Mailbox geography, holds and account-specific amendments were not independently inspected. No universal UK-only storage, fixed backup-erasure deadline or individually signed terms are claimed. |
| Vercel | Its [DPA](https://vercel.com/legal/dpa), introduction and Schedules 3/5, describes Pro/Enterprise coverage and UK transfer clauses. [General terms section 11](https://vercel.com/legal/terms) incorporate the DPA by reference. | The DPA's stated plan scope does not establish full processor coverage for the recorded Hobby account. This is a specific hosting issue, not a request to negotiate new terms with every provider. |

These are documented standard mechanisms, rather than a blanket assertion that all account-specific arrangements or transfer assessments have been verified. The customer policy reflects that distinction and links directly to the terms. No additional data-protection infrastructure is required for this wording.

## Current launch position

The New Travel trading arrangement and provider review are established context. Do not reopen them or revisit the hosting-plan decision during bespoke setup. Offer enquiries remain operational. For bespoke enquiries, run the single new migration, set `BESPOKE_ENQUIRIES_ENABLED=true` in the intended deployment, then deploy and perform one owner-contact public-form test. [BESPOKE-ENQUIRIES.md](BESPOKE-ENQUIRIES.md) gives the exact steps and private retry procedure.

Continue applying the existing monthly retention procedure to both enquiry tables and related email/provider copies. The admin inboxes review and retry notifications; they do not introduce a deletion workflow. Submission and notification retry times do not establish last meaningful customer contact.

## Checks

The bespoke completion checks include the shared privacy link and unchanged publication guard. Both forms use page-memory retry tokens and keep answers out of browser storage. Automated mail uses isolated fixtures; the actual bespoke mailbox test follows Jay's manual setup, not an assistant claim of delivery. The project runtime is Node 22.13 or later; the available local Node 20 uses a temporary test-only WebSocket shim during automated validation.
